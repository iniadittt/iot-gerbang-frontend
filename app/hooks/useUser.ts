import { useState, useEffect } from "react";
import { BACKEND_URL } from "~/constant/setting";

export interface User {
	id: number;
	username: string;
	fullname: string;
	rfid: string;
}

export function useUser() {
	const [loading, setLoading] = useState(true);
	const [user, setUser] = useState<User | null>(null);
	const [authenticated, setAuthenticated] = useState(false);

	useEffect(() => {
		if (typeof window === "undefined") return;

		const token = localStorage.getItem("token");
		if (!token) {
			setAuthenticated(false);
			setUser(null);
			setLoading(false);
			localStorage.removeItem("token");
			localStorage.removeItem("user");
			return;
		}

		const controller = new AbortController();
		const signal = controller.signal;
		let isMounted = true;

		fetch(`${BACKEND_URL}/me`, {
			method: "GET",
			headers: {
				Authorization: `Bearer ${token}`,
			},
			signal,
		})
			.then(async (response) => {
				if (!response.ok) throw new Error("Unauthorized");
				const result = await response.json();

				const userData = result?.data?.user;
				const isAuthenticated = result?.data?.authenticated;

				if (isMounted && isAuthenticated && userData) {
					setUser({
						id: userData.id,
						username: userData.username,
						fullname: userData.fullname,
						rfid: userData.rfid,
					});
					setAuthenticated(true);
					localStorage.setItem("token", token);
					localStorage.setItem("user", JSON.stringify(userData));
				} else {
					throw new Error("Invalid auth");
				}
			})
			.catch((err) => {
				if (err.name === "AbortError") {
					console.log("Fetch dibatalkan");
					return;
				}
				console.error("Error fetching user:", err);
				if (isMounted) {
					setAuthenticated(false);
					setUser(null);
					localStorage.removeItem("token");
					localStorage.removeItem("user");
				}
			})
			.finally(() => {
				if (isMounted) {
					setLoading(false);
				}
			});

		return () => {
			isMounted = false;
			controller.abort();
		};
	}, []);

	return { user, authenticated, loading };
}
