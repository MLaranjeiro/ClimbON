import { MessageSquare } from 'lucide-react';
import type { BetaRow } from '../hooks/useRouteDetail';
import { Avatar } from './Avatar';

export function BetaList({ beta }: { beta: BetaRow[] }) {
  return (
    <ul className="space-y-4">
      {beta.map((b) => (
        <li key={b.id} className="flex gap-3">
          <Avatar src={b.profile?.avatar_url} name={b.profile?.username} size={28} />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-gray-900 flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-gray-400" />
              {b.profile?.username ?? 'Unknown climber'}
            </p>
            {b.description_text && <p className="text-sm text-gray-700 mt-1">{b.description_text}</p>}
            {b.video_url && (
              <video
                src={b.video_url}
                controls
                className="mt-2 w-full max-w-sm rounded-lg bg-black"
              />
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
