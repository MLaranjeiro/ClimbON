import { useParams } from 'react-router-dom';

export function RouteDetails() {
  const { routeId } = useParams();

  return (
    <div className="card-light">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Route #{routeId}</h1>
      <p className="text-gray-500">
        Grade, gym, community difficulty, and beta content land here in Week 5.
      </p>
    </div>
  );
}
