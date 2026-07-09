# Contributing Guide

Contributions to the ISU Premium ID Generator are welcome! Whether you're fixing bugs, optimizing the rendering pipeline, or adding new ID templates for upcoming school years, this guide will help you get started.

## 🧑‍💻 Adding a New ID Template (e.g., 2027)

Adding a new ID template design requires updating the HTML radio toggles and mapping the text coordinates in `app.js`.

### 1. Prepare Your Image Assets
- Ensure your base ID images are high-resolution PNGs.
- Name them descriptively, e.g., `new_template_front_2027.png` and `new_template_back_2027.png`.
- Place them in the `images/` directory (or a new subdirectory like `images/2027_id/`).

### 2. Update the UI (`index.html`)
Find the `.version-toggle` container inside the form section and add a new radio button for the new year:
```html
<label class="vt-btn">
    <input type="radio" name="id-version" value="2027">
    <span>2027 ID</span>
</label>
```

### 3. Register the Assets (`app.js`)
At the top of `app.js`, add your new templates to the `templateImages` object so they preload correctly:
```javascript
const templateImages = {
    // ... existing templates ...
    front_2027: null,
    back_2027: null
};

// Inside the load block:
templateImages.front_2027 = new Image();
templateImages.front_2027.src = 'images/2027_id/new_template_front_2027.png';
// repeat for back...
```

### 4. Create a Text Configuration Object (`app.js`)
Search for `TEXT_CONFIG_2026` in `app.js`. Copy it, rename it to `TEXT_CONFIG_2027`, and adjust the `x` and `y` coordinates to match the new image dimensions.
> **Tip:** If your canvas width is 675px, the exact horizontal center is `x: 337.5`.

```javascript
const TEXT_CONFIG_2027 = {
    name: {
        x: 337.5, y: 700,
        align: 'center',
        font: "42px 'Arial'",
        isBold: true,
        fillStyle: '#000000'
    },
    // ... other fields ...
};
```

### 5. Update the `renderCard` Logic (`app.js`)
In the `renderCard()` function, add an `else if (idVersion === '2027')` block to handle drawing the new templates and selecting the new `TEXT_CONFIG_2027`. Ensure you set `frontCanvas.width` appropriately based on the new image's width.

## 🐛 Bug Reports & Feature Requests
If you find a bug or have a suggestion, please open an issue in the GitHub repository. Provide clear steps to reproduce any bugs, including browser version and screen size if applicable.
