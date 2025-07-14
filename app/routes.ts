import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [index("routes/home.tsx"), route("dashboard", "routes/dashboard.tsx"), route("admin", "routes/admin.tsx"), route("login", "routes/login.tsx")] satisfies RouteConfig;
