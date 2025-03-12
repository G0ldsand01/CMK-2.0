let cart = JSON.parse(localStorage.getItem("cart")) || [];

// Function to update cart count in UI
function updateCartCount() {
  const cartCountElement = document.getElementById("cart-count");
  if (cartCountElement) {
    const cartCount = cart.reduce((total, item) => total + item.quantity, 0);
    cartCountElement.textContent = cartCount;
  }
}

// Function to save cart to localStorage and update UI
function saveCart() {
  localStorage.setItem("cart", JSON.stringify(cart));
  updateCartCount();
}

// Function to add a product to the cart
function addToCart(product) {
  const existingProduct = cart.find((item) => item.id === product.id);
  
  if (existingProduct) {
    existingProduct.quantity += 1;
  } else {
    product.quantity = 1;
    cart.push(product);
  }
  
  saveCart();
  updateCartCount();
}

// Function to get cart items
function getCart() {
  return JSON.parse(localStorage.getItem("cart")) || [];
}

// Function to clear the cart
function clearCart() {
  cart = []; // Reset cart array
  saveCart();
}

// Function to remove an item from the cart
function removeFromCart(productId) {
  cart = cart.filter((item) => item.id !== productId);
  saveCart();
}

// Function to update the quantity of an item in the cart
function updateQuantity(productId, quantity) {
  const product = cart.find((item) => item.id === productId);
  if (product) {
    product.quantity = quantity;
    saveCart();
  }
}

// Checkout function (Stripe Integration)
async function checkout() {
  // Create a Checkout Session with the selected products
  const cart = getCart();
  const stripe = Stripe("pk_test_51Qx9tsL7PH3OOG4xDVxLfU5C91N1flikSXFpVSZteC17JFbiPP6W9R0X9nUDhccCmk5pIzM8hN2N7zsWqpRqaV3W005BhvO9j4");
  const response = await fetch("/create-checkout-session", {

    method: "POST",

    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ cart }),
  });
  const session = await response.json();
  await stripe.redirectToCheckout({ sessionId: session.id });

}

// Ensure cart count is updated on page load
document.addEventListener("DOMContentLoaded", updateCartCount);
