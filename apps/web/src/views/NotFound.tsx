/**
 * The 404 page, shown for any unknown URL (the host serves the app shell for every path).
 * Uses: components/Link.
 */

import { Link } from "../components/Link";

export default function NotFound() {
  return (
    <div className="strategy notfound">
      <h1 className="page-title">This card isn't in the deck.</h1>
      <p className="lead">The page you're looking for doesn't exist — maybe it never did.</p>
      <p className="hero-ctas">
        <Link to="/" className="btn btn-primary">
          Back to the front page
        </Link>
        <Link to="/table" className="btn">
          Open the table
        </Link>
      </p>
    </div>
  );
}
