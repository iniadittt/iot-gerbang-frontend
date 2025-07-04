import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { PageLoading } from "~/components/pageloading";
import { useUser } from "~/hooks/useUser";
import { APP_ROUTES, BACKEND_URL } from "~/constant/setting";

export default function Login() {
	const navigate = useNavigate();
	const { authenticated, loading } = useUser();

	const [data, setData] = useState({
		username: "",
		password: "",
	});
	const [isLoading, setIsLoading] = useState(false);
	const [errorMessage, setErrorMessage] = useState("");

	useEffect(() => {
		if (loading) return;
		if (!loading && authenticated) {
			navigate(APP_ROUTES.dashboard);
		}
	}, [authenticated, loading, navigate]);

	if (loading) {
		return <PageLoading />;
	}

	const signIn = async (event: React.FormEvent) => {
		event.preventDefault();
		setErrorMessage("");

		try {
			setIsLoading(true);

			const response = await fetch(`${BACKEND_URL}/login`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					username: data.username,
					password: data.password,
				}),
			});

			const result = await response.json();

			if (!response.ok) {
				setErrorMessage(result?.message || "Login gagal.");
				return;
			}

			const token = result?.data?.token;
			if (!token) {
				setErrorMessage("Token tidak ditemukan.");
				return;
			}

			localStorage.setItem("token", token);

			window.location.href = APP_ROUTES.dashboard;
		} catch (error: any) {
			setErrorMessage(`Terjadi kesalahan: ${error.message}`);
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<section className="bg-muted h-screen">
			<div className="flex h-full items-center justify-center">
				<div className="flex w-full max-w-sm flex-col items-center gap-y-8">
					<form
						onSubmit={signIn}
						className="border-muted bg-background flex w-full flex-col gap-8 rounded-md border px-6 py-12 shadow-md"
					>
						<div className="flex flex-col items-center gap-y-2">
							<h1 className="text-3xl font-semibold">Masuk</h1>
							<p className="text-muted-foreground text-sm">Gunakan username dan password untuk masuk</p>
						</div>
						<div className="flex flex-col gap-6">
							<div className="flex flex-col gap-2">
								<Label>Username</Label>
								<Input
									type="text"
									placeholder="Masukkan username"
									className="bg-background"
									value={data.username}
									onChange={(event) => {
										setData((prev) => ({ ...prev, username: event.target.value }));
									}}
									required
								/>
							</div>
							<div className="flex flex-col gap-2">
								<Label>Password</Label>
								<Input
									type="password"
									placeholder="Masukkan password"
									className="bg-background"
									value={data.password}
									onChange={(event) => {
										setData((prev) => ({ ...prev, password: event.target.value }));
									}}
									required
								/>
							</div>
							{errorMessage && <div className="text-red-600 text-sm">{errorMessage}</div>}
							<div className="flex flex-col gap-4">
								<Button
									type="submit"
									className="mt-2 w-full cursor-pointer bg-blue-600 hover:bg-blue-600/90"
								>
									{isLoading ? <div className="mr-2 w-5 h-5 border-l-2 border-white rounded-full animate-spin" /> : <span>Masuk</span>}
								</Button>
							</div>
						</div>
					</form>
				</div>
			</div>
		</section>
	);
}
