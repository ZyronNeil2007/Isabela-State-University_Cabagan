# Features Overview

The ISU Premium ID Generator is packed with powerful features designed to streamline the ID creation process.

## 🔍 OCR Autofill from Photo
Instead of manually typing student details for reprints, users can snap or upload a photo of an existing ID or registration form. 
- **Tesseract.js Integration:** The app uses Tesseract.js WebAssembly (WASM) to run Optical Character Recognition entirely within the browser.
- **Smart Parsing:** A custom regex parser scans the extracted text for Name, ID Number, Course, and Date of Birth. It automatically formats dates to `YYYY-MM-DD` and normalizes names to uppercase.

## 💾 Local Session Auto-Save
Never lose your work. The application continually serializes the entire state—including up to 5 student records, uploaded photos, drawn signatures, and text fields—into the browser's `localStorage`.
- **Restore Banner:** If you close the tab, a sliding toast banner will prompt you to restore your previous session upon returning.

## ♾️ Unlimited CSV Batch Import
Generate an entire department's IDs in seconds.
- Upload a `.csv` file with student data.
- The system uses fuzzy matching to map columns (e.g., matching "Student Num", "ID No", or "Student Number" to the correct field).
- Bypasses the manual 5-tab limit, loading hundreds of students directly into the batch export engine.

## 📄 Native PDF Export
The print batch engine uses `jsPDF` to generate proper multi-page A4 PDF documents.
- **CR80 Standard Dimensions:** Each ID is perfectly scaled to 3.375" x 2.125", making them perfectly sized for professional PVC card printers.
- **Auto-Grid Layout:** Dynamically arranges 1 to 5 student IDs into an optimized grid layout on the A4 page.

## 🪄 Local Signature Extraction
A built-in digital signature suite allows users to draw or upload signatures.
- **Contrast Enhancement:** If a user uploads a photo of a signature on white paper, the application applies mathematical thresholding and pixel filters via the HTML5 Canvas to boost contrast, crop empty margins, and strip grey/white backgrounds into transparency—no external APIs required.

## 🫧 Premium UI/UX Design
- **Bento Grid & Scroll Reveals:** A cinematic, split-screen landing experience featuring a 6-card Bento grid and staggered IntersectionObserver scroll reveals.
- **Glassmorphism:** Multi-tier CSS3 glass panels with backdrop blur and saturation layers.
- **Interactive 3D Preview:** Real-time mouse-hover 3D tilt powered by VanillaTilt.js, bringing the generated IDs to life on screen.
