import { useParams } from 'react-router-dom';

export function RouteDetails() {
  const { routeId } = useParams();

  return (
    <div className="card">
      <h1 className="text-2xl font-bold text-white mb-2">Route #{routeId}</h1>
      <p className="text-gray-400">
        Grade, gym, community difficulty, and beta content land here in Week 5.
      </p>
    </div>
  );
}
