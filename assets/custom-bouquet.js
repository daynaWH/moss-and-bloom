document.addEventListener("DOMContentLoaded", function () {
    const configurator = {
        selections: {
            size: null,
            palette: null,
            style: null,
            occasion: null,
        },
        prices: {
            base: 0,
            final: 0,
        },
        lightbox: {
            isOpen: false,
            scale: 1,
            translateX: 0,
            translateY: 0,
            startX: 0,
            startY: 0,
        },
        // Store all product images for palette/size combinations
        productImages: {},

        init: function () {
            this.loadProductImages();
            this.bindEvents();
            this.bindLightboxEvents();
            this.updateUI();
        },

        // Load and organize all product images by palette and size
        loadProductImages: function () {
            // Get all product images from the gallery thumbnails and any variant data
            const galleryThumbs = document.querySelectorAll(".gallery-thumb");
            const variantImages = document.querySelectorAll(
                "#variant-images [data-size]"
            );

            // Process gallery images (look for palette keywords in alt text)
            galleryThumbs.forEach((thumb) => {
                const img = thumb.querySelector("img");
                if (img && img.alt) {
                    const imageUrl = thumb.dataset.imageUrl;
                    const alt = img.alt.toLowerCase();

                    // Extract palette and size from alt text
                    let palette = null;
                    let size = null;

                    // Check for palette keywords in alt text
                    if (alt.includes("pastel")) palette = "pastel";
                    else if (alt.includes("bright") || alt.includes("bold"))
                        palette = "bright";
                    else if (alt.includes("white") && alt.includes("green"))
                        palette = "white-green";
                    else if (alt.includes("seasonal")) palette = "seasonal";

                    // Check for size keywords in alt text
                    if (alt.includes("small")) size = "small";
                    else if (alt.includes("medium")) size = "medium";
                    else if (alt.includes("large")) size = "large";

                    // Store the image data
                    if (palette) {
                        if (!this.productImages[palette]) {
                            this.productImages[palette] = {};
                        }
                        if (size) {
                            this.productImages[palette][size] = imageUrl;
                        } else {
                            // If no size specified, use as default for all sizes
                            this.productImages[palette].default = imageUrl;
                        }
                    }
                }
            });

            // Also process variant images
            variantImages.forEach((variant) => {
                const size = variant.dataset.size;
                const imageUrl = variant.dataset.imageUrl;
                const alt = variant.dataset.imageAlt
                    ? variant.dataset.imageAlt.toLowerCase()
                    : "";

                if (alt && imageUrl) {
                    let palette = null;

                    // Check for palette keywords in alt text
                    if (alt.includes("pastel")) palette = "pastel";
                    else if (alt.includes("bright") || alt.includes("bold"))
                        palette = "bright";
                    else if (alt.includes("white") && alt.includes("green"))
                        palette = "white-green";
                    else if (alt.includes("seasonal")) palette = "seasonal";

                    if (palette) {
                        if (!this.productImages[palette]) {
                            this.productImages[palette] = {};
                        }
                        this.productImages[palette][size] = imageUrl;
                    }
                }
            });

            console.log("Loaded product images:", this.productImages);
        },

        // Get the best matching image for current palette and size selection
        getImageForSelection: function (palette, size) {
            if (!palette || !this.productImages[palette]) {
                return null;
            }

            const paletteImages = this.productImages[palette];

            // Try to get exact size match first
            if (size && paletteImages[size]) {
                return paletteImages[size];
            }

            // Fall back to default image for this palette
            if (paletteImages.default) {
                return paletteImages.default;
            }

            // If no exact match, try to get any image from this palette
            const availableSizes = Object.keys(paletteImages);
            if (availableSizes.length > 0) {
                return paletteImages[availableSizes[0]];
            }

            return null;
        },

        bindEvents: function () {
            // Size selection
            document.querySelectorAll("[data-size]").forEach((btn) => {
                btn.addEventListener("click", (e) => {
                    this.selectOption("size", e.target.closest("[data-size]"));
                });
            });

            // Palette selection - Updated to handle image changes
            document.querySelectorAll("[data-palette]").forEach((btn) => {
                btn.addEventListener("click", (e) => {
                    this.selectOption(
                        "palette",
                        e.target.closest("[data-palette]")
                    );
                });
            });

            // Style selection
            document.querySelectorAll("[data-style]").forEach((btn) => {
                btn.addEventListener("click", (e) => {
                    this.selectOption(
                        "style",
                        e.target.closest("[data-style]")
                    );
                });
            });

            // Occasion selection
            document.querySelectorAll("[data-occasion]").forEach((btn) => {
                btn.addEventListener("click", (e) => {
                    this.selectOption(
                        "occasion",
                        e.target.closest("[data-occasion]")
                    );
                });
            });

            // Gallery thumbnail clicks
            document.querySelectorAll(".gallery-thumb").forEach((thumb) => {
                thumb.addEventListener("click", (e) => {
                    const imageUrl =
                        e.target.closest(".gallery-thumb").dataset.imageUrl;
                    this.updatePreviewImage(imageUrl);
                });
            });

            // Add to cart
            document
                .getElementById("add-to-cart-custom")
                .addEventListener("click", () => {
                    this.addToCart();
                });

            // Preview image click to open lightbox
            document.addEventListener("click", (e) => {
                if (e.target.classList.contains("zoomable-image")) {
                    this.openLightbox(e.target);
                }
            });
        },

        bindLightboxEvents: function () {
            const lightbox = document.getElementById("image-lightbox");
            const lightboxClose = document.getElementById("lightbox-close");
            const lightboxImage = document.getElementById("lightbox-image");

            // Close lightbox
            lightboxClose.addEventListener("click", () => {
                this.closeLightbox();
            });

            // Close on overlay click
            lightbox.addEventListener("click", (e) => {
                if (e.target === lightbox) {
                    this.closeLightbox();
                }
            });

            // Keyboard controls
            document.addEventListener("keydown", (e) => {
                if (this.lightbox.isOpen) {
                    if (e.key === "Escape") {
                        this.closeLightbox();
                    }
                }
            });

            // Mouse wheel zoom
            lightboxImage.addEventListener("wheel", (e) => {
                if (this.lightbox.isOpen) {
                    e.preventDefault();
                    const delta = e.deltaY > 0 ? -0.1 : 0.1;
                    this.zoomImage(delta);
                }
            });
        },

        selectOption: function (type, element) {
            // Remove selected class from siblings
            element.parentElement
                .querySelectorAll(".config-option")
                .forEach((opt) => {
                    opt.classList.remove("selected");
                });

            // Add selected class to current element
            element.classList.add("selected");

            // Update selections
            this.selections[type] = element.dataset[type];

            // Update preview image based on current selections
            this.updatePreviewImageFromSelections();

            // Update progress indicator
            this.updateProgress(type);

            // Update pricing and UI
            this.updatePricing();
            this.updateUI();
        },

        updateProgress: function (type) {
            const progressDot = document.getElementById(`progress-${type}`);
            if (progressDot) {
                progressDot.classList.add("completed");
                progressDot.innerHTML = "✓";
            }
        },

        updatePricing: function () {
            this.prices.base = this.selections.size
                ? parseInt(
                      document.querySelector(
                          `[data-size="${this.selections.size}"]`
                      ).dataset.price
                  )
                : 0;

            this.prices.final = this.prices.base;
        },

        // Updated to handle both palette and size changes
        updatePreviewImageFromSelections: function () {
            const selectedPalette = this.selections.palette;
            const selectedSize = this.selections.size;

            // Get the best matching image for current selections
            const imageUrl = this.getImageForSelection(
                selectedPalette,
                selectedSize
            );

            if (imageUrl) {
                this.updatePreviewImage(imageUrl);
            } else {
                // If no specific image found, try to update from size variants (original behavior)
                this.updatePreviewImageFromSize();
            }
        },

        // Original size-based image update (fallback)
        updatePreviewImageFromSize: function () {
            const selectedSize = this.selections.size;
            if (!selectedSize) return;

            const variantImageData = document.querySelector(
                `#variant-images [data-size="${selectedSize}"]`
            );
            if (variantImageData) {
                const imageUrl = variantImageData.dataset.imageUrl;
                if (imageUrl) {
                    this.updatePreviewImage(imageUrl);
                }
            }
        },

        // Centralized image update function
        updatePreviewImage: function (imageUrl, imageAlt = null) {
            const previewImage = document.getElementById("preview-image");
            const noImagePlaceholder = document.getElementById(
                "no-image-placeholder"
            );

            if (previewImage && imageUrl) {
                // Update the preview image
                previewImage.src = imageUrl;
                if (imageAlt) {
                    previewImage.alt = imageAlt;
                }

                // Generate larger version for lightbox
                const largeSrc = imageUrl.replace(/width=\d+/, "width=1200");
                previewImage.setAttribute("data-large-src", largeSrc);

                // Show image, hide placeholder
                previewImage.style.display = "block";
                if (noImagePlaceholder)
                    noImagePlaceholder.style.display = "none";

                // Add smooth transition effect
                previewImage.style.opacity = "0.5";
                setTimeout(() => {
                    previewImage.style.opacity = "1";
                }, 150);
            } else {
                // Show placeholder if no image
                if (previewImage) previewImage.style.display = "none";
                if (noImagePlaceholder)
                    noImagePlaceholder.style.display = "flex";
            }
        },

        openLightbox: function (imageElement) {
            const lightbox = document.getElementById("image-lightbox");
            const lightboxImage = document.getElementById("lightbox-image");
            const lightboxTitle = document.getElementById("lightbox-title");

            // Get large image source or fallback to current src
            const largeSrc = imageElement.dataset.largeSrc || imageElement.src;

            lightboxImage.src = largeSrc;
            lightboxImage.alt = imageElement.alt;
            lightboxTitle.textContent = imageElement.alt || "Bouquet Preview";

            lightbox.classList.add("active");
            this.lightbox.isOpen = true;
            this.resetLightboxTransform();

            // Prevent body scroll
            document.body.style.overflow = "hidden";
        },

        closeLightbox: function () {
            const lightbox = document.getElementById("image-lightbox");
            lightbox.classList.remove("active");
            this.lightbox.isOpen = false;
            this.resetLightboxTransform();

            // Restore body scroll
            document.body.style.overflow = "";
        },

        resetLightboxTransform: function () {
            this.lightbox.scale = 1;
            this.lightbox.translateX = 0;
            this.lightbox.translateY = 0;
            this.updateLightboxTransform();
        },

        updateLightboxTransform: function () {
            const lightboxImage = document.getElementById("lightbox-image");
            lightboxImage.style.transform = `scale(${this.lightbox.scale}) translate(${this.lightbox.translateX}px, ${this.lightbox.translateY}px)`;

            if (this.lightbox.scale > 1) {
                lightboxImage.classList.add("zoomed");
            } else {
                lightboxImage.classList.remove("zoomed");
            }
        },

        zoomImage: function (delta) {
            const newScale = Math.max(
                0.5,
                Math.min(3, this.lightbox.scale + delta)
            );
            this.lightbox.scale = newScale;

            // Reset position if zoomed out completely
            if (newScale <= 1) {
                this.lightbox.translateX = 0;
                this.lightbox.translateY = 0;
            }

            this.updateLightboxTransform();
        },

        updateUI: function () {
            // Update summary with better formatting
            const sizeEl = document.getElementById("selected-size");
            const paletteEl = document.getElementById("selected-palette");
            const styleEl = document.getElementById("selected-style");
            const occasionEl = document.getElementById("selected-occasion");

            // Size
            if (sizeEl) {
                if (this.selections.size) {
                    sizeEl.textContent = capitalize(this.selections.size);
                    sizeEl.classList.remove("not-selected");
                } else {
                    sizeEl.textContent = "Not selected";
                    sizeEl.classList.add("not-selected");
                }
            }

            // Palette
            if (paletteEl) {
                if (this.selections.palette) {
                    paletteEl.textContent = capitalizePhrase(
                        this.selections.palette
                    );
                    paletteEl.classList.remove("not-selected");
                } else {
                    paletteEl.textContent = "Not selected";
                    paletteEl.classList.add("not-selected");
                }
            }

            // Style
            if (styleEl) {
                if (this.selections.style) {
                    styleEl.textContent = capitalize(this.selections.style);
                    styleEl.classList.remove("not-selected");
                } else {
                    styleEl.textContent = "Not selected";
                    styleEl.classList.add("not-selected");
                }
            }

            // Occasion
            if (occasionEl) {
                if (this.selections.occasion) {
                    occasionEl.textContent = capitalizePhrase(
                        this.selections.occasion
                    );
                    occasionEl.classList.remove("not-selected");
                } else {
                    occasionEl.textContent = "None";
                    occasionEl.classList.add("not-selected");
                }
            }

            // Update pricing display
            const priceFinal = document.getElementById("final-price");
            if (priceFinal) priceFinal.textContent = `$${this.prices.final}`;

            // Update add to cart button
            const addToCartBtn = document.getElementById("add-to-cart-custom");
            const cartNote = document.querySelector(".cart-note");

            if (addToCartBtn && cartNote) {
                if (
                    this.selections.size &&
                    this.selections.palette &&
                    this.selections.style
                ) {
                    addToCartBtn.disabled = false;
                    cartNote.textContent = "Ready to add to cart!";
                    cartNote.style.color = "#28a745";
                } else {
                    addToCartBtn.disabled = true;
                    cartNote.textContent =
                        "Complete your selections to add to cart";
                    cartNote.style.color = "#666";
                }
            }
        },

        addToCart: function () {
            if (
                !this.selections.size ||
                !this.selections.palette ||
                !this.selections.style
            ) {
                alert("Please complete all required selections");
                return;
            }

            const addToCartBtn = document.getElementById("add-to-cart-custom");

            if (!addToCartBtn) {
                console.error("Add to Cart button not found");
                alert("Add to Cart button is missing. Please contact support.");
                return;
            }

            const originalText = addToCartBtn.textContent;

            addToCartBtn.textContent = "Adding to Cart...";
            addToCartBtn.disabled = true;

            let allVariants = [];
            const variantsDataElement = document.getElementById(
                "product-variants-data"
            );
            if (variantsDataElement) {
                try {
                    allVariants = JSON.parse(variantsDataElement.textContent);
                } catch (e) {
                    console.error("Error parsing product variants data:", e);
                    alert(
                        "Could not load product variant data. Please try again later."
                    );
                    addToCartBtn.textContent = originalText;
                    addToCartBtn.disabled = false;
                    return;
                }
            } else {
                console.warn(
                    "Product variants data element not found. Make sure it's present in your Liquid."
                );
                // Fallback or error handling if variants data isn't easily accessible
                alert(
                    "Product configuration data is missing. Cannot add to cart."
                );
                addToCartBtn.textContent = originalText;
                addToCartBtn.disabled = false;
                return;
            }

            // Find the matching variant based on selected options
            const selectedVariant = allVariants.find((variant) => {
                const sizeMatch =
                    variant.option1 &&
                    variant.option1.toLowerCase() === this.selections.size;
                const paletteMatch =
                    variant.option2 &&
                    variant.option2.toLowerCase() === this.selections.palette;
                const styleMatch =
                    variant.option3 &&
                    variant.option3.toLowerCase() === this.selections.style;

                return sizeMatch && paletteMatch && styleMatch;
            });

            if (!selectedVariant) {
                alert(
                    "No product variant found for your selections. Please adjust your choices."
                );
                console.error(
                    "No variant found for selections:",
                    this.selections
                );
                addToCartBtn.textContent = originalText;
                addToCartBtn.disabled = !(
                    this.selections.size &&
                    this.selections.palette &&
                    this.selections.style
                );
                return;
            }

            const variantId = selectedVariant.id;

            const formData = {
                items: [
                    {
                        // id: productId,
                        id: variantId,
                        quantity: 1,
                        properties: {
                            Size: capitalize(this.selections.size),
                            "Color Palette": capitalizePhrase(
                                this.selections.palette
                            ),
                            Style: capitalize(this.selections.style),
                            Occasion: this.selections.occasion
                                ? capitalizePhrase(this.selections.occasion)
                                : "None",
                        },
                    },
                ],
            };

            fetch("/cart/add.js", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(formData),
            })
                .then((response) => response.json())
                .then((data) => {
                    if (data.status) {
                        // Check for errors returned by Shopify
                        console.error("Shopify cart add error:", data);
                        alert(
                            `Error adding to cart: ${
                                data.message || "Unknown error"
                            }. ${data.description || ""}`
                        );
                        addToCartBtn.textContent = originalText;
                        addToCartBtn.style.background = "";
                        addToCartBtn.disabled = !(
                            this.selections.size &&
                            this.selections.palette &&
                            this.selections.style
                        );
                        return;
                    }
                    // Redirect to cart or show success message
                    window.location.href = "/cart";
                })
                .catch((error) => {
                    console.error(
                        "Network or fetch error adding to cart:",
                        error
                    );
                    alert(
                        "Network error adding to cart. Please check your connection and try again."
                    );
                    addToCartBtn.textContent = originalText;
                    addToCartBtn.style.background = "";
                    addToCartBtn.disabled = !(
                        this.selections.size &&
                        this.selections.palette &&
                        this.selections.style
                    );
                });
        },
    };

    function capitalize(str) {
        return str
            ? str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
            : "";
    }

    function capitalizePhrase(str) {
        return str
            ? str
                  .replace("-", " ")
                  .split(" ")
                  .map((word) => capitalize(word))
                  .join(" ")
            : "";
    }

    configurator.init();
});
