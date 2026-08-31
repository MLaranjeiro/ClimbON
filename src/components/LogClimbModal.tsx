import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, Video, X } from 'lucide-react';
import { useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { useAuth } from '../context/auth';
import { getErrorMessage, logError } from '../lib/errors';
import { GRADE_ORDER, getGradeBadgeClasses, gradeFromRatingValue, gradeToRatingValue } from '../lib/grades';
import { supabase } from '../lib/supabase';
import type { RouteGrade } from '../types';
import { ErrorAlert } from './ErrorAlert';
import { ModalShell } from './ModalShell';

interface LogClimbModalProps {
  routeId: number;
  routeName: string;
  grade: RouteGrade;
  sectionName?: string | null;
  onClose: () => void;
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

export function LogClimbModal({ routeId, routeName, grade, sectionName, onClose }: LogClimbModalProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // null = user hasn't touched this field yet, so it falls back to their existing
  // send/rating (once loaded) or the field's own default.
  const [dateOverride, setDateOverride] = useState<string | null>(null);
  const [gradeOverride, setGradeOverride] = useState<RouteGrade | null>(null);
  const [notes, setNotes] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [videoFileName, setVideoFileName] = useState('');
  const [videoUploading, setVideoUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const { data: existing } = useQuery({
    queryKey: ['my-send', routeId, user?.id],
    enabled: !!user,
    queryFn: async () => {
      const [{ data: sendRow }, { data: ratingRow }] = await Promise.all([
        supabase
          .from('sends')
          .select('date_completed')
          .eq('route_id', routeId)
          .eq('user_id', user!.id)
          .maybeSingle(),
        supabase
          .from('difficulty_ratings')
          .select('grade')
          .eq('route_id', routeId)
          .eq('user_id', user!.id)
          .maybeSingle(),
      ]);
      return { send: sendRow, rating: ratingRow };
    },
  });

  const isUpdating = !!existing?.send;
  const date = dateOverride ?? existing?.send?.date_completed ?? today();
  const suggestedGrade =
    gradeOverride ?? (existing?.rating?.grade != null ? gradeFromRatingValue(existing.rating.grade) : grade);

  async function handleVideoChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !user) return;

    setError(null);
    setVideoUploading(true);

    const ext = file.name.split('.').pop();
    const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
    const { error: uploadError } = await supabase.storage.from('beta-videos').upload(path, file);

    if (uploadError) {
      setVideoUploading(false);
      setError(getErrorMessage(uploadError, 'Upload failed.'));
      logError('log-climb.video-upload', uploadError, { routeId, userId: user.id });
      return;
    }

    const { data } = supabase.storage.from('beta-videos').getPublicUrl(path);
    setVideoUploading(false);
    setVideoUrl(data.publicUrl);
    setVideoFileName(file.name);
  }

  function removeVideo() {
    setVideoUrl('');
    setVideoFileName('');
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSubmitting(true);
    setError(null);

    const { error: sendError } = await supabase
      .from('sends')
      .upsert(
        { user_id: user.id, route_id: routeId, date_completed: date },
        { onConflict: 'user_id,route_id' },
      );

    if (sendError) {
      setError(getErrorMessage(sendError));
      logError('log-climb.submit', sendError, { routeId, userId: user.id });
      setSubmitting(false);
      return;
    }

    const { error: ratingError } = await supabase
      .from('difficulty_ratings')
      .upsert(
        { route_id: routeId, user_id: user.id, grade: gradeToRatingValue(suggestedGrade) },
        { onConflict: 'route_id,user_id' },
      );
    if (ratingError) logError('log-climb.rating-upsert', ratingError, { routeId, userId: user.id });

    if (notes.trim() || videoUrl.trim()) {
      const { error: betaError } = await supabase.from('beta').insert({
        route_id: routeId,
        user_id: user.id,
        description_text: notes.trim() || null,
        video_url: videoUrl.trim() || null,
      });
      if (betaError) logError('log-climb.beta-insert', betaError, { routeId, userId: user.id });
    }

    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['route-stats', routeId] }),
      queryClient.invalidateQueries({ queryKey: ['route-beta', routeId] }),
      queryClient.invalidateQueries({ queryKey: ['sends', user.id] }),
      queryClient.invalidateQueries({ queryKey: ['beta', user.id] }),
    ]);

    setSubmitting(false);
    onClose();
  }

  return (
    <ModalShell title={isUpdating ? 'Update Log' : 'Log Climb'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="rounded-lg border border-gray-200 p-3 flex items-center gap-3">
          <span className={`badge ${getGradeBadgeClasses(grade)}`}>{grade}</span>
          <div className="min-w-0">
            <p className="font-semibold text-gray-900 truncate">{routeName}</p>
            {sectionName && <p className="text-xs text-gray-500">{sectionName}</p>}
          </div>
        </div>

        {isUpdating && (
          <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            You've already logged this climb — submitting will update your date and grade suggestion.
          </p>
        )}

        <div>
          <label htmlFor="logDate" className="block text-sm text-gray-600 mb-1">
            Date
          </label>
          <input
            id="logDate"
            type="date"
            className="input-field-light"
            value={date}
            max={today()}
            onChange={(e) => setDateOverride(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block text-sm text-gray-600 mb-2">What do you think the grade should be?</label>
          <div className="flex flex-wrap gap-2">
            {GRADE_ORDER.map((g) => {
              const active = suggestedGrade === g;
              return (
                <button
                  key={g}
                  type="button"
                  onClick={() => setGradeOverride(g)}
                  className={`badge cursor-pointer ${active ? getGradeBadgeClasses(g) : 'bg-gray-100 text-gray-600'}`}
                >
                  {g}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label htmlFor="logNotes" className="block text-sm text-gray-600 mb-1">
            Notes (optional)
          </label>
          <textarea
            id="logNotes"
            className="input-field-light min-h-20"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Beta, cruxes, tips for next time…"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-600 mb-1">Video (optional)</label>
          {videoUrl ? (
            <div className="relative">
              <video src={videoUrl} controls className="w-full h-40 rounded-lg border border-gray-200 bg-black" />
              <div className="absolute top-2 right-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => videoInputRef.current?.click()}
                  className="bg-white/90 hover:bg-white text-gray-700 text-xs font-medium px-2.5 py-1.5 rounded-lg shadow-sm"
                >
                  Change
                </button>
                <button
                  type="button"
                  onClick={removeVideo}
                  className="bg-white/90 hover:bg-white text-red-600 text-xs font-medium px-2.5 py-1.5 rounded-lg shadow-sm"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1 truncate">{videoFileName}</p>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => videoInputRef.current?.click()}
              disabled={videoUploading}
              className="w-full h-24 flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 text-gray-500 hover:border-gray-400 hover:text-gray-600 disabled:opacity-50"
            >
              {videoUploading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Video className="w-5 h-5" />
                  <span className="text-sm">Upload a video from your device</span>
                </>
              )}
            </button>
          )}
          <input
            ref={videoInputRef}
            type="file"
            accept="video/*"
            className="hidden"
            onChange={handleVideoChange}
          />
        </div>

        {error && <ErrorAlert message={error} light />}

        <button type="submit" className="btn-primary w-full" disabled={submitting || videoUploading}>
          {submitting
            ? isUpdating
              ? 'Updating…'
              : 'Logging…'
            : isUpdating
              ? `Update Log for ${routeName}`
              : `Log Climb for ${routeName}`}
        </button>
      </form>
    </ModalShell>
  );
}
