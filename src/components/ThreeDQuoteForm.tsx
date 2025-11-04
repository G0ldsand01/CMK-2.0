import { ShoppingCart } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';
import { Button } from '@/components/ui/button';

export default function ThreeDQuoteForm() {
	// --- Controlled form state ---
	const [form, setForm] = useState({
		firstName: '',
		lastName: '',
		email: '',
		address: '',
		city: '',
		state: '',
		zip: '',
		material: 'PLA',
		printer: 'small',
		color: '#000000',
		notes: '',
	});

	const [file, setFile] = useState<File | null>(null);
	const [step, setStep] = useState(0);
	const [cost, setCost] = useState(0);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const canvasRef = useRef<HTMLCanvasElement | null>(null);

	// === handle input changes ===
	const handleChange = (
		e: React.ChangeEvent<
			HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
		>,
	) => {
		const { name, value } = e.target;
		setForm((prev) => ({ ...prev, [name]: value }));
	};

	// === STL Viewer effect ===
	useEffect(() => {
		if (!file || !canvasRef.current) return;
		setLoading(true);
		setError(null);

		const canvas = canvasRef.current;
		const renderer = new THREE.WebGLRenderer({
			canvas,
			antialias: true,
			alpha: true,
		});
		renderer.setSize(400, 400);
		renderer.setPixelRatio(window.devicePixelRatio);

		const scene = new THREE.Scene();
		scene.background = new THREE.Color(0xf6f6f6);

		const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 1000);
		camera.position.set(0, 0, 100);

		const controls = new OrbitControls(camera, renderer.domElement);
		controls.enableDamping = true;

		const ambient = new THREE.AmbientLight(0xffffff, 0.6);
		const dir = new THREE.DirectionalLight(0xffffff, 0.9);
		dir.position.set(1, 1, 2);
		scene.add(ambient, dir);

		const grid = new THREE.GridHelper(200, 20, 0x999999, 0xcccccc);
		grid.position.y = -50;
		scene.add(grid);

		const loader = new STLLoader();
		const reader = new FileReader();

		reader.onload = (e) => {
			try {
				const geometry = loader.parse(e.target?.result as ArrayBuffer);
				geometry.computeBoundingBox();
				geometry.center();

				const material = new THREE.MeshStandardMaterial({
					color: new THREE.Color(form.color),
					metalness: 0.1,
					roughness: 0.6,
				});
				const mesh = new THREE.Mesh(geometry, material);
				scene.add(mesh);

				const bbox = geometry.boundingBox!;
				const size = bbox.getSize(new THREE.Vector3());
				const maxDim = Math.max(size.x, size.y, size.z);
				const center = bbox.getCenter(new THREE.Vector3());
				camera.position.set(
					center.x + maxDim * 2,
					center.y + maxDim * 1.5,
					center.z + maxDim * 2,
				);
				camera.lookAt(center);

				const volume = calculateVolume(geometry);
				setCost(parseFloat((volume * 0.02).toFixed(2))); // $0.02 per cm³

				let frame: number;
				const animate = () => {
					frame = requestAnimationFrame(animate);
					controls.update();
					renderer.render(scene, camera);
				};
				animate();

				setLoading(false);
				return () => {
					cancelAnimationFrame(frame);
					geometry.dispose();
					material.dispose();
					renderer.dispose();
				};
			} catch (err) {
				console.error('STL Error:', err);
				setError('Invalid STL file.');
				setLoading(false);
			}
		};

		reader.readAsArrayBuffer(file);
	}, [file, form.color]); // reload if color changes

	const calculateVolume = (geometry: THREE.BufferGeometry) => {
		const pos = geometry.attributes.position.array as ArrayLike<number>;
		let vol = 0;
		for (let i = 0; i < pos.length; i += 9) {
			const ax = pos[i],
				ay = pos[i + 1],
				az = pos[i + 2];
			const bx = pos[i + 3],
				by = pos[i + 4],
				bz = pos[i + 5];
			const cx = pos[i + 6],
				cy = pos[i + 7],
				cz = pos[i + 8];
			vol +=
				(ax * (by * cz - bz * cy) -
					ay * (bx * cz - bz * cx) +
					az * (bx * cy - by * cx)) /
				6;
		}
		return Math.abs(vol) / 1000;
	};

	// === Checkout ===
	const handleCheckout = async () => {
		if (!file) return alert('Please upload a valid STL file first.');

		const res = await fetch('/api/stripe/create-session', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				...form,
				filename: file.name,
				filesize: file.size,
				amount: cost,
			}),
		});

		const data = await res.json();
		if (data.url) {
			window.location.href = data.url;
		} else {
			alert('Checkout failed: ' + (data.error || 'Unknown error'));
		}
	};

	const next = () => setStep((s) => Math.min(s + 1, 2));
	const prev = () => setStep((s) => Math.max(s - 1, 0));

	return (
		<div className="w-full max-w-2xl bg-muted p-8 rounded-2xl shadow-xl">
			<h1 className="text-center text-3xl font-bold mb-4">
				3D Print Quote Service
			</h1>
			<p className="text-center text-muted-foreground mb-6">
				Upload your model, preview it, and get an instant quote.
			</p>

			{/* STEP 1 */}
			{step === 0 && (
				<div className="space-y-4">
					<div className="flex flex-col md:flex-row gap-4">
						<input
							name="firstName"
							value={form.firstName}
							onChange={handleChange}
							placeholder="First Name"
							required
							className="input"
						/>
						<input
							name="lastName"
							value={form.lastName}
							onChange={handleChange}
							placeholder="Last Name"
							required
							className="input"
						/>
					</div>
					<input
						name="email"
						type="email"
						value={form.email}
						onChange={handleChange}
						placeholder="Email"
						required
						className="input"
					/>
					<div className="flex flex-col md:flex-row gap-4">
						<input
							name="address"
							value={form.address}
							onChange={handleChange}
							placeholder="Address"
							required
							className="input"
						/>
						<input
							name="city"
							value={form.city}
							onChange={handleChange}
							placeholder="City"
							required
							className="input"
						/>
					</div>
					<div className="flex flex-col md:flex-row gap-4">
						<input
							name="state"
							value={form.state}
							onChange={handleChange}
							placeholder="State"
							required
							className="input"
						/>
						<input
							name="zip"
							value={form.zip}
							onChange={handleChange}
							placeholder="Zip"
							required
							className="input"
						/>
					</div>
					<div className="flex justify-end">
						<Button onClick={next}>Next</Button>
					</div>
				</div>
			)}

			{/* STEP 2 */}
			{step === 1 && (
				<div className="space-y-4">
					<input
						type="file"
						accept=".stl"
						onChange={(e) => setFile(e.target.files?.[0] || null)}
						className="w-full px-4 py-2 border rounded-md bg-background text-foreground"
					/>
					<select
						name="material"
						value={form.material}
						onChange={handleChange}
						className="input">
						<option value="PLA">PLA</option>
						<option value="ABS">ABS</option>
						<option value="PETG">PETG</option>
						<option value="TPU">TPU</option>
					</select>
					<select
						name="printer"
						value={form.printer}
						onChange={handleChange}
						className="input">
						<option value="small">Small / 180mm</option>
						<option value="medium">Ender 3 / 220mm</option>
						<option value="large">Large / 256mm</option>
					</select>
					<select
						name="color"
						value={form.color}
						onChange={handleChange}
						className="input">
						<option value="#000000">Black</option>
						<option value="#ffffff">White</option>
						<option value="#808080">Grey</option>
						<option value="#0000ff">Blue</option>
					</select>
					<textarea
						name="notes"
						value={form.notes}
						onChange={handleChange}
						placeholder="Additional details…"
						className="w-full p-2 border rounded-md bg-background text-foreground"
					/>
					<div className="flex justify-between">
						<Button onClick={prev}>Previous</Button>
						<Button onClick={next}>Next</Button>
					</div>
				</div>
			)}

			{/* STEP 3 */}
			{step === 2 && (
				<div className="space-y-6 text-center">
					{loading && <p>Loading 3D preview…</p>}
					{error && <p className="text-red-600">{error}</p>}
					<canvas
						ref={canvasRef}
						width="400"
						height="400"
						className="mx-auto rounded-lg border bg-muted"
					/>
					<p className="text-lg text-muted-foreground">
						Estimated Cost:{' '}
						<span className="text-green-500 font-bold">
							{cost.toFixed(2)} $
						</span>
					</p>
					<div className="flex justify-between">
						<Button onClick={prev}>Previous</Button>
						<Button
							onClick={handleCheckout}
							className="flex items-center gap-2">
							<ShoppingCart className="w-4 h-4" /> Go to Checkout
						</Button>
					</div>
				</div>
			)}
		</div>
	);
}
