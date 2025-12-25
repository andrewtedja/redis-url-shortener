import { useState } from "react";
import Navbar from "./navbar";

const API_BASE = import.meta.env.VITE_API_URL || "";

interface ShortenResponse {
	shortCode: string;
	shortUrl: string;
	originalUrl: string;
	expiresIn: number | null;
	rateLimitRemaining: number;
}

interface StatsResponse {
	shortCode: string;
	originalUrl: string;
	clicks: number;
}

export default function MainApp() {
	// ================== States ==================
	const [url, setUrl] = useState("");
	const [expiresIn, setExpiresIn] = useState("");
	const [shortenResult, setShortenResult] = useState<ShortenResponse | null>(
		null
	);
	const [shortenError, setShortenError] = useState("");
	const [shortenLoading, setShortenLoading] = useState(false);
	const [copied, setCopied] = useState(false);

	// Buat stats
	const [statsCode, setStatsCode] = useState("");
	const [statsResult, setStatsResult] = useState<StatsResponse | null>(null);
	const [statsError, setStatsError] = useState("");
	const [statsLoading, setStatsLoading] = useState(false);
	const [queryTime, setQueryTime] = useState("0");

	// ================== Handlers API ==================

	// POST /shorten and update states
	const handleShorten = async (e: React.FormEvent) => {
		e.preventDefault();
		setShortenError("");
		setShortenResult(null);
		setShortenLoading(true);

		try {
			const body: { url: string; expiresIn?: number } = { url };
			if (expiresIn) body.expiresIn = parseInt(expiresIn);

			const response = await fetch(`${API_BASE}/api/shorten`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(body),
			});

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.error || "Failed to shorten URL");
			}

			setShortenResult(data);
			setUrl("");
			setExpiresIn("");
		} catch (error) {
			setShortenError(error instanceof Error ? error.message : "Unknown error");
		} finally {
			setShortenLoading(false);
		}
	};

	const handleCopy = () => {
		if (shortenResult) {
			navigator.clipboard.writeText(shortenResult.shortUrl);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		}
	};

	// ================== Stats Handler API ==================
	// GET /stats/:code
	const handleStats = async () => {
		if (!statsCode.trim()) return;

		setStatsError("");
		setStatsResult(null);
		setStatsLoading(true);

		try {
			const start = performance.now();
			const response = await fetch(`${API_BASE}/api/stats/${statsCode.trim()}`);
			const elapsed = (performance.now() - start).toFixed(2);

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.error || "Short URL not found");
			}

			setStatsResult(data);
			setQueryTime(elapsed);
		} catch (error) {
			setStatsError(error instanceof Error ? error.message : "Unknown error");
		} finally {
			setStatsLoading(false);
		}
	};

	return (
		<div className="min-h-screen bg-gray-50">
			<Navbar />

			<div className="max-w-7xl mx-auto px-4 py-8">
				<div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
					{/* ================== SHORTEN FORM ================== */}
					<div className="bg-white rounded-lg shadow p-6 h-fit lg:sticky lg:top-8">
						<div className="mb-6">
							<h2 className="text-xl font-bold text-gray-900 mb-2">
								Shorten URL
							</h2>
							<p className="text-sm text-gray-600">Create a short link</p>
						</div>

						<form onSubmit={handleShorten} className="space-y-4">
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-2">
									URL
								</label>
								<input
									type="url"
									value={url}
									onChange={(e) => setUrl(e.target.value)}
									placeholder="https://example.com/very-long-url"
									required
									disabled={shortenLoading}
									className="w-full px-3 py-2 border border-gray-300 rounded-md focus:border-indigo-500 outline-none disabled:bg-gray-50"
								/>
							</div>

							<div>
								<label className="block text-sm font-medium text-gray-700 mb-2">
									Expires in (seconds)
								</label>
								<input
									type="number"
									value={expiresIn}
									onChange={(e) => setExpiresIn(e.target.value)}
									placeholder="3600"
									min="1"
									disabled={shortenLoading}
									className="w-full px-3 py-2 border border-gray-300 rounded-md focus:border-indigo-500 outline-none disabled:bg-gray-50"
								/>
								<p className="text-xs text-gray-500 mt-1">
									Optional. Leave empty for no expiration.
								</p>
							</div>

							<button
								type="submit"
								disabled={shortenLoading}
								className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
							>
								{shortenLoading ? "Shortening..." : "Shorten URL"}
							</button>
						</form>

						{/* ================== SHORTEN RESULT ================== */}
						{shortenResult && (
							<div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-md">
								<p className="text-sm text-gray-600 mb-2">Short URL:</p>
								<div className="flex items-center gap-2">
									<a
										href={shortenResult.shortUrl}
										target="_blank"
										rel="noopener noreferrer"
										className="flex-1 text-indigo-600 hover:underline break-all font-mono text-sm"
									>
										{shortenResult.shortUrl}
									</a>
									<button
										onClick={handleCopy}
										className="px-3 py-1 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700"
									>
										{copied ? "Copied!" : "Copy"}
									</button>
								</div>
								<div className="mt-3 text-xs text-gray-600">
									<p>Code: {shortenResult.shortCode}</p>
									<p>Rate Limit: {shortenResult.rateLimitRemaining}/10</p>
								</div>
							</div>
						)}

						{shortenError && (
							<div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
								<p className="text-sm text-red-800">{shortenError}</p>
							</div>
						)}
					</div>

					{/* ================== STATS VIEWER ================== */}
					<div className="bg-white rounded-lg shadow p-6">
						<div className="mb-6">
							<h2 className="text-xl font-bold text-gray-900 mb-2">
								Analytics
							</h2>
							<p className="text-sm text-gray-600">
								View stats for a short URL
							</p>
						</div>

						<div className="flex gap-2">
							<input
								type="text"
								value={statsCode}
								onChange={(e) => setStatsCode(e.target.value)}
								onKeyDown={(e) => {
									if (e.key === "Enter") {
										e.preventDefault();
										handleStats();
									}
								}}
								placeholder="Enter short code"
								disabled={statsLoading}
								className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:border-indigo-500 outline-none disabled:bg-gray-50"
							/>
							<button
								type="button"
								onClick={handleStats}
								disabled={statsLoading || !statsCode.trim()}
								className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
							>
								{statsLoading ? "Loading..." : "Get Stats"}
							</button>
						</div>

						{statsResult && (
							<div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
								<div className="space-y-3">
									<div>
										<p className="text-xs text-gray-600 mb-1">Original URL:</p>
										<a
											href={statsResult.originalUrl}
											target="_blank"
											rel="noopener noreferrer"
											className="text-sm text-indigo-600 hover:underline break-all"
										>
											{statsResult.originalUrl}
										</a>
									</div>
									<div>
										<p className="text-xs text-gray-600 mb-1">Clicks:</p>
										<p className="text-2xl font-bold text-gray-900">
											{statsResult.clicks}
										</p>
									</div>
									<div>
										<p className="text-xs text-gray-600 mb-1">Query Time:</p>
										<p className="text-lg font-semibold text-green-600">
											{queryTime} ms
										</p>
									</div>
								</div>
							</div>
						)}

						{statsError && (
							<div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
								<p className="text-sm text-red-800">{statsError}</p>
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
