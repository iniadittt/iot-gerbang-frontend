import { DoorClosed, DoorOpen } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { PageLoading } from "~/components/pageloading";
import { Button } from "~/components/ui/button";
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "~/components/ui/card";
import { APP_ROUTES, APPLICATION, BACKEND_URL } from "~/constant/setting";
import { useUser } from "~/hooks/useUser";
import { io } from "socket.io-client";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "~/components/ui/select";

const socket = io(BACKEND_URL, {
	transports: ["websocket"],
});

export default function Dashboard() {
	const navigate = useNavigate();
	const { user, authenticated, loading } = useUser();

	const [isLoading, setIsLoading] = useState(false);
	const [data, setData] = useState<{
		current: any;
		lifetime: any;
	}>({
		current: null,
		lifetime: null,
	});
	const [pdf, setPdf] = useState<{
		status: string | null;
		bulan: number | null;
		tahun: number | null;
	}>({
		status: null,
		bulan: null,
		tahun: null,
	});

	const getData = async () => {
		try {
			setIsLoading(true);
			const token = localStorage.getItem("token");

			const response = await fetch(`${BACKEND_URL}/sensor`, {
				method: "GET",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
			});

			const result = await response.json();

			if (!response.ok) {
				console.error("Request failed:", result);
				setData((prev) => ({
					...prev,
					current: null,
					lifetime: null,
				}));
				return;
			}

			if (result.success && Array.isArray(result.data)) {
				const sorted = [...result.data].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
				const lifetime = sorted;
				const current = sorted[0];
				setData((prev) => ({
					...prev,
					current,
					lifetime,
				}));
			} else {
				setData((prev) => ({
					...prev,
					current: null,
					lifetime: null,
				}));
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

		if (socket) {
			socket.on("sensor", (data) => {
				const sorted = [...data].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
				const lifetime = sorted;
				const current = sorted[0];
				setData((prev) => ({
					...prev,
					current,
					lifetime,
				}));
			});
		}

		return () => {
			if (socket) {
				socket.off("sensor");
			}
		};
	}, [navigate, authenticated, loading]);

	if (loading || isLoading) {
		return <PageLoading />;
	}

	const handlerPdf = async (event: React.FormEvent) => {
		event.preventDefault();
		try {
			setIsLoading(true);
			const token = localStorage.getItem("token");

			const response = await fetch(`${BACKEND_URL}/pdf`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify(pdf),
			});

			const result = await response.json();

			if (!response.ok || !result.success) {
				console.error("Request failed:", result);
				return;
			}

			let base64 = result.data.base64;

			if (base64.startsWith("data:application/pdf;base64,")) {
				base64 = base64.replace("data:application/pdf;base64,", "");
			}

			const byteCharacters = atob(base64);
			const byteNumbers = new Array(byteCharacters.length).fill(0).map((_, i) => byteCharacters.charCodeAt(i));
			const byteArray = new Uint8Array(byteNumbers);
			const blob = new Blob([byteArray], { type: "application/pdf" });
			const blobUrl = URL.createObjectURL(blob);
			const link = document.createElement("a");
			link.href = blobUrl;
			link.download = result.data.filename;
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
			URL.revokeObjectURL(blobUrl);

			setPdf({
				status: null,
				bulan: null,
				tahun: null,
			});
		} catch (error: any) {
			console.error(`Terjadi kesalahan: ${error.message}`);
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
								onClick={handlerLogout}
								disabled={isLoading}
							>
								Keluar
							</Button>
						</div>
					</nav>
				</div>
			</section>

			<div className="px-4 mt-8 container mx-auto grid grid-cols-1 xl:grid-cols-2 gap-4">
				<Card className="@container/card border-border divide-border bg-background rounded-lg shadow">
					<CardHeader>
						<CardDescription>Status Gerbang Terakhir</CardDescription>
						<div className="flex justify-between">
							<CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl capitalize">{data?.current?.status || "-"}</CardTitle>
							{data?.current?.status === "Terbuka" ? <DoorOpen className="size-8 mr-4" /> : data?.current?.status === "Tertutup" ? <DoorClosed className="size-8 mr-4" /> : null}
						</div>
					</CardHeader>
					<CardFooter className="flex-col items-start text-md">
						<div className="text-muted-foreground">{data?.current?.status === "Terbuka" ? "Dibuka pada" : data?.current?.status === "Tertutup" ? "Ditutup pada" : null}</div>
						<div className="line-clamp-1 flex gap-2 font-semibold">
							{data?.current?.createdAt
								? `${new Date(data.current.createdAt).toLocaleString("id-ID", {
										day: "2-digit",
										month: "long",
										year: "numeric",
										hour: "2-digit",
										minute: "2-digit",
										second: "2-digit",
								  })} WIB`
								: "-"}
						</div>
					</CardFooter>
				</Card>

				<Card className="@container/card border-border divide-border bg-background rounded-lg shadow">
					<CardHeader>
						<CardDescription>Ibu Guru</CardDescription>
						<CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl capitalize">{data?.current?.user?.fullname || "-"}</CardTitle>
					</CardHeader>
					<CardFooter className="flex-col items-start text-md">
						<div className="text-muted-foreground">ID RFID</div>
						<div className="line-clamp-1 flex gap-2 font-semibold">{data?.current?.user?.rfid || "-"}</div>
					</CardFooter>
				</Card>
			</div>

			<div>
				<div className="container mx-auto px-4">
					<div className="bg-white p-4 border-border divide-border rounded-lg shadow mt-6 grid grid-cols-1 xl:grid-cols-4 gap-4">
						<Select onValueChange={(value) => setPdf((prev) => ({ ...prev, status: value }))}>
							<SelectTrigger
								className="w-full"
								onChange={(event) => console.log({ event })}
							>
								<SelectValue placeholder="Pilih Status" />
							</SelectTrigger>
							<SelectContent>
								<SelectGroup>
									<SelectLabel>Status</SelectLabel>
									{[
										{ label: "Semua", value: "semua" },
										{ label: "Terbuka", value: "terbuka" },
										{ label: "Tertutup", value: "tertutup" },
									].map((item, index) => (
										<SelectItem
											key={index}
											value={item.value.toString()}
										>
											{item.label}
										</SelectItem>
									))}
								</SelectGroup>
							</SelectContent>
						</Select>

						<Select onValueChange={(value) => setPdf((prev) => ({ ...prev, bulan: parseInt(value) }))}>
							<SelectTrigger className="w-full">
								<SelectValue placeholder="Pilih Bulan" />
							</SelectTrigger>
							<SelectContent>
								<SelectGroup>
									<SelectLabel>Bulan</SelectLabel>
									{[
										{ label: "Januari", value: 1 },
										{ label: "Februari", value: 2 },
										{ label: "Maret", value: 3 },
										{ label: "April", value: 4 },
										{ label: "Mei", value: 5 },
										{ label: "Juni", value: 6 },
										{ label: "Juli", value: 7 },
										{ label: "Agustus", value: 8 },
										{ label: "September", value: 9 },
										{ label: "Oktober", value: 10 },
										{ label: "November", value: 11 },
										{ label: "Desember", value: 12 },
									].map((item, index) => (
										<SelectItem
											key={index}
											value={item.value.toString()}
										>
											{item.label}
										</SelectItem>
									))}
								</SelectGroup>
							</SelectContent>
						</Select>

						<Select onValueChange={(value) => setPdf((prev) => ({ ...prev, tahun: parseInt(value) }))}>
							<SelectTrigger className="w-full">
								<SelectValue placeholder="Pilih Tahun" />
							</SelectTrigger>
							<SelectContent>
								<SelectGroup>
									<SelectLabel>Tahun</SelectLabel>
									{Array.from({ length: 11 }, (_, i) => {
										const year = new Date().getFullYear() - i;
										return (
											<SelectItem
												key={year}
												value={year.toString()}
											>
												{year}
											</SelectItem>
										);
									})}
								</SelectGroup>
							</SelectContent>
						</Select>

						<Button
							onClick={handlerPdf}
							className="bg-green-600 hover:bg-green-600/90 cursor-pointer disabled:bg-gray-600"
							disabled={isLoading || !pdf.status || !pdf.bulan || !pdf.tahun}
						>
							Download PDF
						</Button>
					</div>
				</div>
			</div>

			<div>
				<section className="py-6">
					<div className="container mx-auto px-4">
						<div className="divide-border border-border bg-background mx-auto divide-y overflow-x-auto rounded-lg shadow">
							<div className="bg-slate-700 text-slate-100 hidden rounded-t-lg text-left text-base font-semibold sm:flex">
								<div className="w-16 px-6 py-4"></div>
								<div className="flex-1 px-6 py-4">Status</div>
								<div className="flex-1 px-6 py-4">Waktu</div>
								<div className="flex-1 px-6 py-4">Oleh</div>
								<div className="flex-1 px-6 py-4">RFID</div>
							</div>

							{data?.lifetime?.map((item: any, index: number) => (
								<div
									key={index}
									className="flex flex-col items-start text-left sm:flex-row sm:items-center"
								>
									<div className="flex w-full items-center justify-start p-[20px] sm:w-16 sm:justify-center sm:py-4">
										{item?.status === "Terbuka" ? <DoorOpen className="size-8" /> : item?.status === "Tertutup" ? <DoorClosed className="size-8" /> : null}
										<span className="ml-3 text-base font-medium sm:hidden">{item?.status ?? "-"}</span>
									</div>
									<div className="w-full flex-1 px-6 pb-2 sm:py-4">
										<div className="hidden font-medium sm:block">{item?.status ?? "-"}</div>
									</div>
									<div className="w-full flex-1 px-6 pb-2 sm:py-4">
										<span className="mr-1 text-muted-foreground inline-block sm:hidden">Waktu:</span>
										<span className="font-semibold sm:font-normal">
											{item?.createdAt
												? `${new Date(data.current.createdAt).toLocaleString("id-ID", {
														day: "2-digit",
														month: "long",
														year: "numeric",
														hour: "2-digit",
														minute: "2-digit",
														second: "2-digit",
												  })} WIB`
												: "-"}
										</span>
									</div>

									<div className="w-full flex-1 px-6 pb-2 sm:py-4">
										<span className="mr-1 text-muted-foreground inline-block sm:hidden">Oleh:</span>
										<span className="font-semibold sm:font-normal">{item?.user?.fullname ?? "-"}</span>
									</div>
									<div className="w-full flex-1 px-6 pb-2 sm:py-4">
										<span className="mr-1 text-muted-foreground inline-block sm:hidden">RFID:</span>
										<span className="font-semibold sm:font-normal">{item?.user?.rfid ?? "-"}</span>
									</div>
								</div>
							))}
						</div>
					</div>
				</section>
			</div>
		</div>
	);
}
