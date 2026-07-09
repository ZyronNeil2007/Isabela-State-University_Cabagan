# Setup & Usage Guide

## 🚀 Running the Project Locally

Because the ISU Premium ID Generator is entirely client-side, running it is as simple as opening a file!

1. **Clone the repository:**
   ```bash
   git clone https://github.com/ZyronNeil2007/Isabela-State-University_Cabagan.git
   cd Isabela-State-University_Cabagan
   ```
2. **Open the App:**
   Simply double-click on `index.html` to open it in your default web browser (Chrome, Edge, Firefox, or Safari).
   *Optional:* If you want to use the CSV import functionality seamlessly, you can serve the directory using a simple local server:
   ```bash
   npx serve .
   # or
   python -m http.server
   ```

## 📋 Generating an ID

1. **Choose Your Version:** On the left form panel, toggle between the "2026 ID" and the "Old ID" template.
2. **Select a Student Tab:** You can work on up to 5 students simultaneously by clicking the numbered tabs at the top of the form.
3. **Fill out the Form or Use OCR:**
   - Type in the Name, ID Number, Course, and Date of Birth.
   - **OR** click the "OCR Scan" button next to the Name field, upload a photo of an existing ID or registration form, and let Tesseract.js autofill the fields for you.
4. **Upload Photos:** Add a front photo and crop it using the built-in modal editor. Add a signature (either draw it directly on the canvas or upload a photo of a signature on paper to automatically extract it).
5. **Real-time Preview:** As you fill out the fields, watch the 3D card on the right update in real-time. Click the card to flip it and view the back.
6. **Export:** Click the green "Export PDF (A4 Batch)" button to generate a print-ready PDF containing all the active student tabs.

## 🖨️ Printing Guidelines

When printing the exported A4 PDF batch, ensure the following settings on your printer dialog:
- **Paper Size:** A4
- **Scale:** 100% or "Actual Size" (Do NOT select "Fit to Page", as this will distort the CR80 ID dimensions).
- **Quality:** High or Photo Quality.
- **Material:** PVC ID card stock or high-quality photo paper for the best results.
