// admin.js - Enhanced Admin Panel with Categories and Brands Management
// --- CONFIGURE THESE ---
/*
IMPORTANT: To enable frontend image deletion from Cloudinary:

1. Go to your Cloudinary Dashboard (https://cloudinary.com/console)
2. Go to Settings → Upload → Upload presets
3. Find your upload preset "HyLoApp" 
4. Edit the preset and scroll down to "Upload control"
5. Set "Delete control" to "Public" or "Signed" 
6. Save the preset

OR

Alternative Method - Enable unsigned deletion:
1. In your Cloudinary dashboard, go to Settings → Security
2. Under "Restricted media types", make sure deletion is allowed
3. Consider setting up auto-deletion rules for uploaded assets

Note: Frontend deletion has security implications. For production, 
consider implementing server-side deletion for better security.
*/

// --- Helper to convert file to base64 ---
async function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// --- DOM Elements ---
const categorySelect = document.getElementById("productCategory");
const brandSelect = document.getElementById("productBrand");

// --- GLOBAL STATE ---
const PRODUCTS_PER_PAGE = 20;
let currentPage = 1;
let totalProducts = 0;
let currentSearch = "";
let editingId = null;
let editingBrandId = null;
const submitBtn = document.getElementById("submitBtn") || document.querySelector("#productForm button[type='submit']");

// --- CATEGORY MANAGEMENT ---
async function loadCategories() {
  try {
    const res = await fetch("../categories.php");
    const json = await res.json();
    const categories = json.data || [];
    categorySelect.innerHTML = '<option value="">Select Category</option>';
    categories.forEach((cat) => {
      const option = document.createElement("option");
      option.value = cat.id;
      option.textContent = cat.name;
      categorySelect.appendChild(option);
    });
    updateCategoryList(categories);
  } catch (error) {
    console.error("Error loading categories:", error);
  }
}

function updateCategoryList(categories) {
  const categoryList = document.getElementById("categoryList");
  if (!categoryList) return;

  categoryList.innerHTML = categories
    .map(
      (cat) => `
        <span class="tag category-tag">
            <span class="tag-name" data-id="${cat.id}">${cat.name}</span>
            <button class="tag-edit" onclick="editCategory(${
              cat.id
            }, '${cat.name.replace(/'/g, "\\'")}')" title="Edit category">
                <i class="fas fa-edit"></i>
            </button>
            <button class="tag-delete" onclick="deleteCategory(${
              cat.id
            })" title="Delete category">
                <i class="fas fa-times"></i>
            </button>
        </span>
    `
    )
    .join("");
}

async function addCategory() {
  const input = document.getElementById("newCategoryInput");
  const name = input.value.trim();
  if (!name) {
    alert("Please enter a category name");
    return;
  }
  try {
    const res = await fetch("../categories.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    const json = await res.json();
    if (!json.success) throw new Error("Failed to add category");
    input.value = "";
    await loadCategories();
    categorySelect.value = json.id;
  } catch (error) {
    console.error("Error adding category:", error);
    alert("Error adding category: " + error.message);
  }
}

async function deleteCategory(id) {
  if (
    !confirm(
      "Delete this category? This will affect all products using this category."
    )
  )
    return;
  try {
    const res = await fetch("../categories.php", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    const json = await res.json();
    if (!json.success) throw new Error("Failed to delete category");
    await loadCategories();
  } catch (error) {
    console.error("Error deleting category:", error);
    alert("Error deleting category: " + error.message);
  }
}

async function editCategory(id, currentName) {
  const newName = prompt("Edit category name:", currentName);
  if (!newName || !newName.trim() || newName.trim() === currentName) return;
  try {
    const res = await fetch("../categories.php", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, name: newName.trim() }),
    });
    const json = await res.json();
    if (!json.success) throw new Error("Failed to update category");
    await loadCategories();
  } catch (error) {
    console.error("Error updating category:", error);
    alert("Error updating category: " + error.message);
  }
}

// --- BRAND MANAGEMENT ---
async function loadBrands() {
  try {
    const res = await fetch("../brands.php");
    const json = await res.json();
    const brands = json.data || [];
    brandSelect.innerHTML = '<option value="">Select Brand</option>';
    brands.forEach((brand) => {
      const option = document.createElement("option");
      option.value = brand.id;
      option.textContent = brand.name;
      brandSelect.appendChild(option);
    });
    updateBrandList(brands);
    initializeBrandSectionState();
  } catch (error) {
    console.error("Error loading brands:", error);
  }
}

// Brand search functionality
function filterBrands(searchTerm) {
  const brandItems = document.querySelectorAll(".brand-item");
  const searchLower = searchTerm.toLowerCase();

  brandItems.forEach((item) => {
    const brandName = item
      .querySelector(".brand-name")
      .textContent.toLowerCase();

    if (brandName.includes(searchLower)) {
      item.classList.remove("hidden");
    } else {
      item.classList.add("hidden");
    }
  });
}

// Show/hide brand search based on brand count
function toggleBrandSearch() {
  const brandSearch = document.getElementById("brandSearch");
  const brandCount = document.getElementById("brandCount");

  if (brandSearch && brandCount) {
    const count = parseInt(brandCount.textContent) || 0;
    if (count > 6) {
      brandSearch.style.display = "block";
    } else {
      brandSearch.style.display = "none";
    }
  }
}

// Enhanced updateBrandList function
function updateBrandList(brands) {
  const brandList = document.getElementById("brandList");
  const brandCount = document.getElementById("brandCount");

  if (!brandList) return;

  // Update brand count
  if (brandCount) {
    brandCount.textContent = brands.length;
  }

  // Toggle search visibility
  toggleBrandSearch();

  if (brands.length === 0) {
    brandList.innerHTML = `
            <div class="brand-list-empty">
                <i class="fas fa-trademark"></i>
                <p>No brands added yet</p>
                <small>Add your first brand using the form above</small>
            </div>
        `;
    return;
  }

  brandList.innerHTML = brands
    .map(
      (brand) => `
      <div class="brand-item" data-brand-id="${brand.id}" title="${brand.name}">
          <div class="brand-info">
              ${
                brand.logo
                  ? `<img src="data:image/png;base64,${brand.logo}" alt="${brand.name}" class="brand-logo-small">`
                  : '<div class="brand-logo-placeholder"><i class="fas fa-image"></i></div>'
              }
              <span class="brand-name">${brand.name}</span>
          </div>
          <div class="brand-actions">
              <button class="action-btn edit-btn" onclick="editBrand(${brand.id}, '${brand.name.replace(/'/g, "\\'")}' )" title="Edit brand name">
                  <i class="fas fa-edit"></i>
              </button>
              <button class="action-btn upload-btn" onclick="uploadBrandLogo(${brand.id})" title="Upload/Change logo">
                  <i class="fas fa-upload"></i>
              </button>
              <button class="action-btn delete-btn" onclick="deleteBrand(${brand.id})" title="Delete brand">
                  <i class="fas fa-times"></i>
              </button>
          </div>
      </div>
  `
    )
    .join("");
}

async function addBrand() {
  const input = document.getElementById("newBrandInput");
  const logoInput = document.getElementById("newBrandLogo");
  const name = input.value.trim();
  if (!name) {
    alert("Please enter a brand name");
    return;
  }
  let logo = "";
  if (logoInput && logoInput.files && logoInput.files[0]) {
    logo = await fileToBase64(logoInput.files[0]);
  }
  try {
    const res = await fetch("../brands.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, logo }),
    });
    const json = await res.json();
    if (!json.success) throw new Error("Failed to add brand");
    input.value = "";
    if (logoInput) logoInput.value = "";
    await loadBrands();
    brandSelect.value = json.id;
  } catch (error) {
    console.error("Error adding brand:", error);
    alert("Error adding brand: " + error.message);
  }
}

async function deleteBrand(id) {
  if (
    !confirm(
      "Delete this brand? This will affect all products using this brand."
    )
  )
    return;
  try {
    const res = await fetch("../brands.php", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    const json = await res.json();
    if (!json.success) throw new Error("Failed to delete brand");
    await loadBrands();
  } catch (error) {
    console.error("Error deleting brand:", error);
    alert("Error deleting brand: " + error.message);
  }
}

async function editBrand(id, currentName) {
  try {
    const res = await fetch("../brands.php");
    const json = await res.json();
    const data = (json.data || []).find((b) => b.id == id);
    if (!data) throw new Error("Brand not found");
    // Hide add form, show edit form
    document.getElementById("addBrandForm").style.display = "none";
    document.getElementById("brandForm").style.display = "flex";
    document.getElementById("brandNameInput").value = data.name;
    const logoInput = document.getElementById("brandLogoInput");
    logoInput.setAttribute("data-current-url", data.logo);
    // Show current logo preview
    const logoPreview = document.getElementById("brandLogoPreview");
    if (logoPreview) {
      logoPreview.innerHTML = `<img src="data:image/png;base64,${data.logo}" alt="Current Logo" style="max-width: 80px; max-height: 80px; border-radius: 8px; box-shadow: 0 2px 8px #0001;">`;
    }
    const logoNote = document.getElementById("brandLogoNote");
    if (logoNote) {
      logoNote.textContent = "Current logo shown. Upload a new logo only if you want to replace it.";
    }
    editingBrandId = id;
    document.getElementById("brandSubmitBtn").innerHTML = '<i class="fas fa-edit"></i> Update Brand';
    logoInput.removeAttribute("required");
    document.getElementById("brandForm").scrollIntoView({ behavior: "smooth" });
  } catch (error) {
    console.error("Error loading brand for edit:", error);
    alert("Error loading brand: " + error.message);
  }
}

// Update Brand logic
async function updateBrand() {
  const name = document.getElementById("brandNameInput").value.trim();
  const logoInput = document.getElementById("brandLogoInput");
  let logo = logoInput.getAttribute("data-current-url") || "";
  if (logoInput.files && logoInput.files[0]) {
    logo = await fileToBase64(logoInput.files[0]);
  }
  if (!name) {
    alert("Please enter a brand name");
    return;
  }
  try {
    const res = await fetch("../brands.php", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: editingBrandId, name, logo }),
    });
    const json = await res.json();
    if (!json.success) throw new Error("Failed to update brand");
    resetBrandForm();
    document.getElementById("brandForm").style.display = "none";
    document.getElementById("addBrandForm").style.display = "flex";
    await loadBrands();
  } catch (error) {
    console.error("Error updating brand:", error);
    alert("Error updating brand: " + error.message);
  }
}

// Brand logo preview on file select
const brandLogoInput = document.getElementById("brandLogoInput");
if (brandLogoInput) {
  brandLogoInput.addEventListener("change", function (e) {
    const file = e.target.files[0];
    const preview = document.getElementById("brandLogoPreview");
    if (file && preview) {
      const reader = new FileReader();
      reader.onload = function (evt) {
        preview.innerHTML = `<img src="${evt.target.result}" alt="Selected Logo" style="max-width: 80px; max-height: 80px; border-radius: 8px; box-shadow: 0 2px 8px #0001;">`;
      };
      reader.readAsDataURL(file);
    }
  });
}

function resetBrandForm() {
  document.getElementById("brandForm").reset();
  const logoPreview = document.getElementById("brandLogoPreview");
  if (logoPreview) logoPreview.innerHTML = "";
  const logoNote = document.getElementById("brandLogoNote");
  if (logoNote) logoNote.textContent = "";
  editingBrandId = null;
}

// --- PRODUCT MANAGEMENT ---
async function loadProducts(page = 1, search = "") {
  try {
    currentPage = page;
    currentSearch = search;
    const res = await fetch("../products.php");
    const json = await res.json();
    let data = json.data || [];
    if (search) {
      data = data.filter((product) =>
        product.product_name.toLowerCase().includes(search.toLowerCase())
      );
    }
    totalProducts = data.length;
    const from = (page - 1) * PRODUCTS_PER_PAGE;
    const to = from + PRODUCTS_PER_PAGE;
    data = data.slice(from, to);
    if (!data || data.length === 0) {
      productsTbody.innerHTML =
        '<tr><td colspan="9" style="text-align: center; padding: 2rem; color: var(--text-secondary);">No products found</td></tr>';
      updatePagination();
      updateProductsInfo();
      return;
    }
    // Update desktop table
    productsTbody.innerHTML = data
      .map(
        (product) => `
            <tr>
                <td><img src="data:image/png;base64,${
                  product.product_image
                }" alt="${product.product_name}"></td>
                <td><strong>${product.product_name}</strong></td>
                <td><strong>₹${product.product_price}</strong></td>
                <td>${product.product_discount || 0}%</td>
                <td>${product.product_moq || 1}</td>
                <td><span class="tag" style="font-size: 0.75rem; padding: 0.25rem 0.5rem;">${
                  product.category_name || "N/A"
                }</span></td>
                <td><span class="tag brand-tag" style="font-size: 0.75rem; padding: 0.25rem 0.5rem;">${
                  product.brand_name || "N/A"
                }</span></td>
                <td style="max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${
                  product.product_description
                }">${product.product_description}</td>
                <td>
                    <div class="action-buttons">
                        <button class="action-btn edit" onclick="editProduct(${
                          product.id
                        })">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="action-btn delete" onclick="deleteProduct(${
                          product.id
                        })">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                </td>
            </tr>
        `
      )
      .join("");

    updatePagination();
    updateProductsInfo();
  } catch (error) {
    console.error("Error loading products:", error);
    productsTbody.innerHTML =
      '<tr><td colspan="9" style="text-align: center; padding: 2rem; color: var(--danger-color);">Error loading products</td></tr>';
    updatePagination();
    updateProductsInfo();
  }
}

function updatePagination() {
  const totalPages = Math.ceil(totalProducts / PRODUCTS_PER_PAGE);
  const paginationContainer = document.getElementById("paginationContainer");

  if (!paginationContainer) return;

  if (totalPages <= 1) {
    paginationContainer.innerHTML = "";
    return;
  }

  let paginationHTML = '<div class="pagination">';

  // Previous button
  if (currentPage > 1) {
    paginationHTML += `<button class="pagination-btn" onclick="changePage(${
      currentPage - 1
    })">
            <i class="fas fa-chevron-left"></i>
        </button>`;
  }

  // Page numbers
  const startPage = Math.max(1, currentPage - 2);
  const endPage = Math.min(totalPages, currentPage + 2);

  if (startPage > 1) {
    paginationHTML += `<button class="pagination-btn" onclick="changePage(1)">1</button>`;
    if (startPage > 2) {
      paginationHTML += '<span class="pagination-ellipsis">...</span>';
    }
  }

  for (let i = startPage; i <= endPage; i++) {
    paginationHTML += `<button class="pagination-btn ${
      i === currentPage ? "active" : ""
    }" onclick="changePage(${i})">
            ${i}
        </button>`;
  }

  if (endPage < totalPages) {
    if (endPage < totalPages - 1) {
      paginationHTML += '<span class="pagination-ellipsis">...</span>';
    }
    paginationHTML += `<button class="pagination-btn" onclick="changePage(${totalPages})">${totalPages}</button>`;
  }

  // Next button
  if (currentPage < totalPages) {
    paginationHTML += `<button class="pagination-btn" onclick="changePage(${
      currentPage + 1
    })">
            <i class="fas fa-chevron-right"></i>
        </button>`;
  }

  paginationHTML += "</div>";
  paginationContainer.innerHTML = paginationHTML;
}

function updateProductsInfo() {
  const productsInfo = document.getElementById("productsInfo");
  if (!productsInfo) return;

  const start = (currentPage - 1) * PRODUCTS_PER_PAGE + 1;
  const end = Math.min(currentPage * PRODUCTS_PER_PAGE, totalProducts);

  if (totalProducts === 0) {
    productsInfo.textContent = "No products found";
  } else {
    productsInfo.textContent = `Showing ${start}-${end} of ${totalProducts} products`;
  }
}

function changePage(page) {
  loadProducts(page, currentSearch);
}

// Search with debouncing
let searchTimeout;
function handleSearch() {
  const searchInput = document.getElementById("productSearch");
  const searchTerm = searchInput ? searchInput.value.trim() : "";

  // Clear previous timeout
  if (searchTimeout) {
    clearTimeout(searchTimeout);
  }

  // Set new timeout for debounced search
  searchTimeout = setTimeout(() => {
    loadProducts(1, searchTerm);
  }, 300); // Wait 300ms after user stops typing
}

function handleSearchImmediate() {
  const searchInput = document.getElementById("productSearch");
  const searchTerm = searchInput ? searchInput.value.trim() : "";
  loadProducts(1, searchTerm);
}

// --- Add/Update Product ---
async function handleProductSubmit(e) {
  e.preventDefault();
  const categoryId = categorySelect.value;
  const brandId = brandSelect.value;
  if (!categoryId || !brandId) {
    alert("Please select both category and brand");
    return;
  }
  submitBtn.disabled = true;
  const name = document.getElementById("productName").value.trim();
  const price = parseFloat(document.getElementById("productPrice").value);
  const discount =
    parseFloat(document.getElementById("productDiscount").value) || 0;
  const moq = parseInt(document.getElementById("productMOQ").value) || 1;
  const description = document
    .getElementById("productDescription")
    .value.trim();
  let imageBase64 = "";
  if (!editingId || document.getElementById("productImage").files[0]) {
    const file = document.getElementById("productImage").files[0];
    if (!file) {
      alert("Image required");
      submitBtn.disabled = false;
      return;
    }
    imageBase64 = await fileToBase64(file);
  } else {
    imageBase64 = document
      .getElementById("productImage")
      .getAttribute("data-current-url");
  }
  const productData = {
    product_name: name,
    product_price: price,
    product_discount: discount,
    product_moq: moq,
    category_id: parseInt(categoryId),
    brand_id: parseInt(brandId),
    product_description: description,
    product_image: imageBase64,
  };
  try {
    let res;
    if (editingId) {
      productData.id = editingId;
      res = await fetch("../products.php", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(productData),
      });
    } else {
      res = await fetch("../products.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(productData),
      });
    }
    const json = await res.json();
    if (!json.success) throw new Error("Failed to save product");
    productForm.reset();
    editingId = null;
    submitBtn.innerHTML = '<i class="fas fa-plus"></i> Add Product';
    await loadProducts();
  } catch (err) {
    console.error("Error saving product:", err);
    alert("Error: " + err.message);
  } finally {
    submitBtn.innerHTML = editingId
      ? '<i class="fas fa-edit"></i> Update Product'
      : '<i class="fas fa-plus"></i> Add Product';
    submitBtn.disabled = false;
  }
}

// --- Edit/Delete Product Functions ---
async function editProduct(id) {
  try {
    const res = await fetch("../products.php");
    const json = await res.json();
    const data = (json.data || []).find((p) => p.id == id);
    if (!data) throw new Error("Product not found");
    document.getElementById("productName").value = data.product_name;
    document.getElementById("productPrice").value = data.product_price;
    document.getElementById("productDiscount").value =
      data.product_discount || 0;
    document.getElementById("productMOQ").value = data.product_moq || 1;
    document.getElementById("productCategory").value = data.category_id;
    document.getElementById("productBrand").value = data.brand_id;
    document.getElementById("productDescription").value =
      data.product_description;
    const imageInput = document.getElementById("productImage");
    imageInput.setAttribute("data-current-url", data.product_image);
    editingId = id;
    submitBtn.innerHTML = '<i class="fas fa-edit"></i> Update Product';
    imageInput.removeAttribute("required");
    document
      .getElementById("productForm")
      .scrollIntoView({ behavior: "smooth" });
  } catch (error) {
    console.error("Error loading product for edit:", error);
    alert("Error loading product: " + error.message);
  }
}

async function deleteProduct(id) {
  if (!confirm("Are you sure you want to delete this product?")) return;
  try {
    const res = await fetch("../products.php", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    const json = await res.json();
    if (!json.success) throw new Error("Failed to delete product");
    await loadProducts();
    alert("Product deleted successfully!");
  } catch (error) {
    console.error("Error deleting product:", error);
    alert("Error deleting product: " + error.message);
  }
}

// --- Reset Form ---
function resetForm() {
  productForm.reset();
  editingId = null;
  submitBtn.innerHTML = '<i class="fas fa-plus"></i> Add Product';
  document.getElementById("productImage").setAttribute("required", "required");
  // Reset brand form as well
  resetBrandForm();
}

// --- COLLAPSIBLE BRAND SECTION ---
function toggleBrandSection() {
  const section = document.getElementById("brandManagementSection");
  const content = section.querySelector(".management-content");
  const icon = section.querySelector(".collapse-icon");

  section.classList.toggle("collapsed");

  if (section.classList.contains("collapsed")) {
    content.style.maxHeight = "0";
    content.style.opacity = "0";
    icon.style.transform = "rotate(-90deg)";
  } else {
    content.style.maxHeight = content.scrollHeight + "px";
    content.style.opacity = "1";
    icon.style.transform = "rotate(0deg)";
  }
}

// Initialize brand section collapse state
function initializeBrandSectionState() {
  setTimeout(() => {
    const brandCount = document.getElementById("brandCount");
    const section = document.getElementById("brandManagementSection");

    if (brandCount && section) {
      const count = parseInt(brandCount.textContent) || 0;
      // Auto-collapse if there are many brands (more than 8)
      if (count > 8) {
        section.classList.add("collapsed");
        const content = section.querySelector(".management-content");
        const icon = section.querySelector(".collapse-icon");

        if (content && icon) {
          content.style.maxHeight = "0";
          content.style.opacity = "0";
          icon.style.transform = "rotate(-90deg)";
        }
      }
    }
  }, 100);
}

// --- UTILITY FUNCTIONS ---
// Utility function to view and manage pending deletions
function viewPendingDeletions() {
  const pendingDeletions = JSON.parse(
    localStorage.getItem("pendingCloudinaryDeletions") || "[]"
  );

  if (pendingDeletions.length === 0) {
    console.log("No pending deletions found");
    return;
  }

  console.log(`Found ${pendingDeletions.length} pending deletions:`);
  console.table(pendingDeletions);

  return pendingDeletions;
}

// Utility function to clear pending deletions
function clearPendingDeletions() {
  localStorage.removeItem("pendingCloudinaryDeletions");
  console.log("Cleared all pending deletions");
}

// Add these to window for console access
window.viewPendingDeletions = viewPendingDeletions;
window.clearPendingDeletions = clearPendingDeletions;

// --- START APPLICATION ---
function initializeApp() {
  loadCategories();
  loadBrands();
  loadProducts();
  // Attach event listeners
  document.getElementById("addCategoryBtn")?.addEventListener("click", addCategory);
  document.getElementById("addBrandBtn")?.addEventListener("click", addBrand);
  document.getElementById("productForm")?.addEventListener("submit", handleProductSubmit);
  document.getElementById("productSearch")?.addEventListener("input", handleSearch);
  // Collapsible brand section
  document.getElementById("brandSectionToggle")?.addEventListener("click", toggleBrandSection);
}

document.addEventListener("DOMContentLoaded", initializeApp);
