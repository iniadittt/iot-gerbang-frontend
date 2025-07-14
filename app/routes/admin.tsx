import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { PageLoading } from "~/components/pageloading";
import { Button } from "~/components/ui/button";
import { APP_ROUTES, APPLICATION, BACKEND_URL } from "~/constant/setting";
import { useUser } from "~/hooks/useUser";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "~/components/ui/alert-dialog";
import { Label } from "~/components/ui/label";
import { Input } from "~/components/ui/input";
import { Trash, Trash2Icon } from "lucide-react";

export default function Dashboard() {
	const navigate = useNavigate();
	const { user, authenticated, loading } = useUser();

	const [isLoading, setIsLoading] = useState(false);
	const [data, setData] = useState<{ id: number; username: string; fullname: string; rfid: string }[]>([]);
	const [createdUser, setCreatedUser] = useState<{ username: string; password: string; fullname: string; rfid: string }>({
		username: "",
		password: "",
		fullname: "",
		rfid: "",
	});
	const [errorMessage, setErrorMessage] = useState("");

	const getData = async () => {
		try {
			setIsLoading(true);
			const token = localStorage.getItem("token");

			const response = await fetch(`${BACKEND_URL}/users`, {
				method: "GET",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
			});

			const result = await response.json();
			if (!response.ok) {
				console.error("Request failed:", result);
				setData([]);
				return;
			}

			if (result.success && Array.isArray(result.data.users)) {
				setData(result.data.users);
			} else {
				setData([]);
			}
		} catch (error: any) {
			console.error(`Terjadi kesalahan: ${error.message}`);
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		if (loading) return;
		if (!loading && !authenticated) {
			navigate(APP_ROUTES.login);
		}
		getData();
	}, [navigate, authenticated, loading]);

	if (loading || isLoading) {
		return <PageLoading />;
	}

	const created = async (event: React.FormEvent) => {
		event.preventDefault();
		setErrorMessage("");

		try {
			setIsLoading(true);
			const token = localStorage.getItem("token");

			const response = await fetch(`${BACKEND_URL}/register`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify({
					username: createdUser.username,
					password: createdUser.password,
					fullname: createdUser.fullname,
					rfid: createdUser.rfid,
				}),
			});

			const result = await response.json();

			if (!response.ok) {
				setErrorMessage(result?.message || "Gagal membuat pengguna.");
				return;
			}

			const newUserId = result?.data?.id;
			if (!newUserId) {
				setErrorMessage("Gagal membuat pengguna.");
				return;
			}
			window.location.href = APP_ROUTES.admin;
		} catch (error: any) {
			setErrorMessage(`Terjadi kesalahan: ${error.message}`);
		} finally {
			setIsLoading(false);
		}
	};

	const deleteUser = async (event: React.FormEvent, id: number) => {
		event.preventDefault();
		setErrorMessage("");

		try {
			setIsLoading(true);
			const token = localStorage.getItem("token");

			const response = await fetch(`${BACKEND_URL}/delete`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify({
					id,
				}),
			});

			const result = await response.json();

			if (!response.ok) {
				setErrorMessage(result?.message || "Gagal menghapus pengguna.");
				return;
			}

			const userDeleted = result?.data?.id;
			if (!userDeleted) {
				setErrorMessage("Gagal menghapus pengguna.");
				return;
			}
			window.location.reload();
		} catch (error: any) {
			setErrorMessage(`Terjadi kesalahan: ${error.message}`);
		} finally {
			setIsLoading(false);
		}
	};

	const handlerLogout = async (event: React.FormEvent) => {
		event.preventDefault();
		localStorage.removeItem("token");
		localStorage.removeItem("user");
		window.location.href = APP_ROUTES.login;
	};

	return (
		<div className="bg-slate-100 min-h-screen">
			<section className="p-4 border-b bg-white">
				<div className="container mx-auto">
					<nav className="flex justify-between">
						<div className="flex items-center gap-6">
							<a
								href={APP_ROUTES.dashboard}
								className="flex items-center gap-2"
							>
								<img className="max-h-8" />
								<span className="text-lg font-semibold tracking-tighter">{APPLICATION.title}</span>
							</a>
						</div>
						<div className="flex gap-2 items-center">
							<h1>
								{user && (
									<>
										<span className="font-semibold">{user.fullname}</span> [{user.rfid}]
									</>
								)}
							</h1>
							<a href="/register"></a>
							{user && user.username === "admin" && (
								<Button
									size="sm"
									className="bg-green-600 hover:bg-green-600/80 cursor-pointer"
									onClick={(event) => {
										event.preventDefault();
										window.location.href = APP_ROUTES.admin;
									}}
								>
									Pengguna
								</Button>
							)}
							<Button
								size="sm"
								className="bg-red-600 hover:bg-red-600/80 cursor-pointer"
								disabled={isLoading}
								onClick={handlerLogout}
							>
								Keluar
							</Button>
						</div>
					</nav>
				</div>
			</section>

			<div>
				<section className="py-6">
					<div className="container mx-auto px-4">
						<div className="flex justify-end">
							<AlertDialog>
								<AlertDialogTrigger asChild>
									<Button
										size="sm"
										className="bg-blue-600 hover:bg-blue-600/80 cursor-pointer mb-4"
									>
										Tambah Pengguna
									</Button>
								</AlertDialogTrigger>
								<AlertDialogContent>
									<AlertDialogHeader>
										<AlertDialogTitle>Tambah Pengguna</AlertDialogTitle>
										<form onSubmit={created}>
											<div className="flex flex-col gap-4 mt-4">
												<div className="flex flex-col gap-2">
													<Label>Username</Label>
													<Input
														type="text"
														placeholder="Masukkan username"
														className="bg-background"
														value={createdUser.username}
														onChange={(event) => {
															setCreatedUser((prev) => ({ ...prev, username: event.target.value }));
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
														value={createdUser.password}
														onChange={(event) => {
															setCreatedUser((prev) => ({ ...prev, password: event.target.value }));
														}}
														required
													/>
												</div>
												<div className="flex flex-col gap-2">
													<Label>Fullname</Label>
													<Input
														type="text"
														placeholder="Masukkan fullname"
														className="bg-background"
														value={createdUser.fullname}
														onChange={(event) => {
															setCreatedUser((prev) => ({ ...prev, fullname: event.target.value }));
														}}
														required
													/>
												</div>
												<div className="flex flex-col gap-2">
													<Label>RFID</Label>
													<Input
														type="text"
														placeholder="Masukkan RFID"
														className="bg-background"
														value={createdUser.rfid}
														onChange={(event) => {
															setCreatedUser((prev) => ({ ...prev, rfid: event.target.value }));
														}}
														required
													/>
												</div>
												{errorMessage && <div className="text-red-600 text-sm">{errorMessage}</div>}
												<div className="flex flex-col gap-2">
													<Button
														type="submit"
														className="mt-2 w-full cursor-pointer bg-blue-600 hover:bg-blue-600/90"
													>
														{isLoading ? <div className="mr-2 w-5 h-5 border-l-2 border-white rounded-full animate-spin" /> : <span>Tambah</span>}
													</Button>
													<AlertDialogCancel className="w-full">Cancel</AlertDialogCancel>
												</div>
											</div>
										</form>
									</AlertDialogHeader>
								</AlertDialogContent>
							</AlertDialog>
						</div>
						{errorMessage && <p className="bg-red-100 text-red-700 mb-4 rounded p-4">{errorMessage}</p>}
						<div className="divide-border border-border bg-background mx-auto divide-y overflow-x-auto rounded-lg shadow">
							<div className="bg-slate-700 text-slate-100 hidden rounded-t-lg text-left text-base font-semibold sm:flex">
								<div className="flex-1 px-6 py-4">Username</div>
								<div className="flex-1 px-6 py-4">Fullname</div>
								<div className="flex-1 px-6 py-4">RFID</div>
								{/* <div className="flex-1 px-6 py-4">Action</div> */}
							</div>
							{data.map((item, index) => {
								return (
									<div
										key={index}
										className="flex flex-col items-start text-left sm:flex-row sm:items-center"
									>
										<div className="w-full flex-1 px-6 pb-2 sm:py-4">
											<span className="mr-1 text-muted-foreground inline-block sm:hidden">Username:</span>
											<span className="font-semibold sm:font-normal">{item?.username ?? "-"}</span>
										</div>
										<div className="w-full flex-1 px-6 pb-2 sm:py-4">
											<span className="mr-1 text-muted-foreground inline-block sm:hidden">Fullname:</span>
											<span className="font-semibold sm:font-normal">{item?.fullname ?? "-"}</span>
										</div>
										<div className="w-full flex-1 px-6 pb-2 sm:py-4">
											<span className="mr-1 text-muted-foreground inline-block sm:hidden">RFID:</span>
											<span className="font-semibold sm:font-normal">{item?.rfid ?? "-"}</span>
										</div>
										{/* {item?.id && (
											<div className="w-full flex-1 px-6 pb-2 sm:py-4">
												<span className="mr-1 text-muted-foreground inline-block sm:hidden">Action:</span>
												<Button
													size="icon"
													className="bg-red-600 hover:bg-red-600/70 cursor-pointer"
													onClick={(event) => deleteUser(event, item.id)}
												>
													<Trash2Icon />
												</Button>
											</div>
										)} */}
									</div>
								);
							})}
						</div>
					</div>
				</section>
			</div>
		</div>
	);
}
