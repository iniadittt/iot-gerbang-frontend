import type { Route } from "./+types/home";
import { useUser } from "~/hooks/useUser";
import { useNavigate } from "react-router";
import { APP_ROUTES } from "~/constant/setting";

export function meta({}: Route.MetaArgs) {
	return [{ title: "Aplikasi Monitoring Sawi Menggunakan Internet Of Things" }, { name: "Sawiku", content: "Selamat datang di aplikasi monitoring sawi menggunakan Internet Of Things!" }];
}

export default function page() {
	const navigate = useNavigate();
	const { authenticated, user } = useUser();
	if (!authenticated || !user) return navigate(APP_ROUTES.login);
	return navigate(APP_ROUTES.dashboard);
}
