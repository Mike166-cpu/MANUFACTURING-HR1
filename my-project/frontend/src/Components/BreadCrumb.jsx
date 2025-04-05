import { Link, useLocation } from "react-router-dom";

const Breadcrumbs = () => {
  const location = useLocation();
  const pathnames = location.pathname.split("/").filter((x) => x);

  // Function to format breadcrumb text (handle camelCase and hyphens)
  const formatBreadcrumb = (text) => {
    return text
      .replace(/([A-Z])/g, " $1") // Add space before capital letters (camelCase)
      .replace(/-/g, " ") // Replace hyphens with spaces
      .trim(); // Remove extra spaces
  };

  return (
    <nav className="text-sm breadcrumbs p-4 font-medium">
      <ul className="flex">
        <li>
          <Link to="/dashboard" className="text-blue-500">
            Home
          </Link>
        </li>
        {pathnames.map((value, index) => {
          const to = `/${pathnames.slice(0, index + 1).join("/")}`;
          const isLast = index === pathnames.length - 1;
          return (
            <li key={to} className="flex items-center">
              {!isLast ? (
                <Link to={to} className="text-blue-500 capitalize">
                  {formatBreadcrumb(value)}
                </Link>
              ) : (
                <span className="text-gray-500 capitalize">{formatBreadcrumb(value)}</span>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
};

export default Breadcrumbs;
