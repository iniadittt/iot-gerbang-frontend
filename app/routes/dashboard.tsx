import { DoorClosed, DoorOpen } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { PageLoading } from "~/components/pageloading";
import { Button } from "~/components/ui/button";
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "~/components/ui/card";
import { APP_ROUTES, APPLICATION, BACKEND_URL } from "~/constant/setting";
import { useUser } from "~/hooks/useUser";

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
	}, [navigate, authenticated, loading]);

	if (loading || isLoading) {
		return <PageLoading />;
	}

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
							<a className="flex items-center gap-2">
								<img className="max-h-8" />
								<span className="text-lg font-semibold tracking-tighter">{APPLICATION.title}</span>
							</a>
						</div>
						<div className="flex gap-6">
							<h1>
								{user && (
									<>
										<span className="font-semibold">{user.fullname}</span> [{user.rfid}]
									</>
								)}
							</h1>
							<Button
								asChild
								size="sm"
								className="bg-red-600 hover:bg-red-600/90"
							>
								<Button
									className="cursor-pointer"
									onClick={handlerLogout}
								>
									Keluar
								</Button>
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
							<CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl capitalize">{data?.current?.status || "Loading"}</CardTitle>
							{data?.current?.status === "Terbuka" ? <DoorOpen className="size-8 mr-4" /> : data?.current?.status === "Tertutup" ? <DoorClosed className="size-8 mr-4" /> : null}
						</div>
					</CardHeader>
					<CardFooter className="flex-col items-start text-md">
						<div className="text-muted-foreground">Dilakukan pada</div>
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
								: "Loading"}
						</div>
					</CardFooter>
				</Card>

				<Card className="@container/card border-border divide-border bg-background rounded-lg shadow">
					<CardHeader>
						<CardDescription>Status Orang Terakhir</CardDescription>
						<CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl capitalize">{data?.current?.user?.fullname || "Loading"}</CardTitle>
					</CardHeader>
					<CardFooter className="flex-col items-start text-md">
						<div className="text-muted-foreground">ID RFID</div>
						<div className="line-clamp-1 flex gap-2 font-semibold">{data?.current?.user?.rfid || "Loading"}</div>
					</CardFooter>
				</Card>
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
										<span className="ml-3 text-base font-medium sm:hidden">{item?.status ?? "Loading"}</span>
									</div>
									<div className="w-full flex-1 px-6 pb-2 sm:py-4">
										<div className="hidden font-medium sm:block">{item?.status ?? "Loading"}</div>
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
												: "Loading"}
										</span>
									</div>

									<div className="w-full flex-1 px-6 pb-2 sm:py-4">
										<span className="mr-1 text-muted-foreground inline-block sm:hidden">Oleh:</span>
										<span className="font-semibold sm:font-normal">{item?.user?.fullname ?? "Loading"}</span>
									</div>
									<div className="w-full flex-1 px-6 pb-2 sm:py-4">
										<span className="mr-1 text-muted-foreground inline-block sm:hidden">RFID:</span>
										<span className="font-semibold sm:font-normal">{item?.user?.rfid ?? "Loading"}</span>
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
