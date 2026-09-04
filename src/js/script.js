const productCards = document.querySelectorAll(".product-card");
const orderSummary = document.querySelector("#pedido-resumo");
const cartSummary = document.querySelector("#carrinho-resumo");
const orderForm = document.querySelector("#pedido-form");
const orderConfirmation = document.querySelector("#pedido-confirmacao");
const nameConfirmation = document.querySelector("#nome-confirmacao");
const cartCount = document.querySelector(".cart-count");
const cartModalElement = document.querySelector("#cart-modal");
const cartModal = bootstrap.Modal.getOrCreateInstance(cartModalElement);
const goToCheckoutButton = document.querySelector("#go-to-checkout");
const checkoutModalElement = document.querySelector("#checkout-modal");
const checkoutModal = bootstrap.Modal.getOrCreateInstance(checkoutModalElement);
const stockStorageKey = "charme-estoque";
const storedStock = JSON.parse(localStorage.getItem(stockStorageKey) || "null");
const stock = {};

productCards.forEach((card) => {
	const productId = card.dataset.productId;
	stock[productId] = storedStock?.[productId] ?? Number(card.dataset.stock);
});

function getSelectedQuantity(card) {
	return Number(card.querySelector(".quantity-value").textContent);
}

function updateStockLabel(card) {
	let label = card.querySelector(".stock-label");
	if (!label) {
		label = document.createElement("small");
		label.className = "stock-label";
		card.querySelector(".card-body").append(label);
	}
	label.textContent = `${stock[card.dataset.productId]} disponível(is)`;
}

function updateOrderSummary() {
	const selectedProducts = [];
	let totalItems = 0;

	productCards.forEach((card) => {
		const quantity = getSelectedQuantity(card);
		totalItems += quantity;
		if (quantity > 0) {
			const name = card.querySelector(".card-title").textContent;
			const price = card.querySelector(".product-price").textContent;
			selectedProducts.push(`${name} - ${quantity} unidade(s) - ${price} cada`);
		}
	});

	const summaryMarkup = selectedProducts.length
		? selectedProducts.map((product) => `<li>${product}</li>`).join("")
		: "<li>Nenhum produto selecionado.</li>";
	orderSummary.innerHTML = summaryMarkup;
	cartSummary.innerHTML = summaryMarkup;
	cartCount.textContent = totalItems;
	goToCheckoutButton.disabled = totalItems === 0;
}

function saveStock() {
	localStorage.setItem(stockStorageKey, JSON.stringify(stock));
}

function refreshProducts() {
	productCards.forEach((card) => {
		const productId = card.dataset.productId;
		const quantity = getSelectedQuantity(card);
		const increaseButton = card.querySelector('[data-action="increase"]');

		updateStockLabel(card);
		increaseButton.disabled = quantity >= stock[productId];
		card.classList.toggle("is-hidden", stock[productId] <= 0);
	});
	updateOrderSummary();
}

productCards.forEach((card) => {
	const control = card.querySelector(".quantity-control");
	const valueElement = card.querySelector(".quantity-value");

	control.addEventListener("click", (event) => {
		const button = event.target.closest(".quantity-button");
		if (!button) return;

		let quantity = getSelectedQuantity(card);
		if (button.dataset.action === "increase" && quantity < stock[card.dataset.productId]) quantity += 1;
		if (button.dataset.action === "decrease" && quantity > 0) quantity -= 1;
		valueElement.textContent = quantity;
		refreshProducts();
	});

	card.querySelector(".order-button").addEventListener("click", () => {
		if (getSelectedQuantity(card) === 0) valueElement.textContent = "1";
		refreshProducts();
		cartModal.show();
	});
});

goToCheckoutButton.addEventListener("click", () => {
	cartModal.hide();
	checkoutModal.show();
});

orderForm.addEventListener("submit", (event) => {
	event.preventDefault();
	const customerName = document.querySelector("#nome").value.trim();
	const hasItems = [...productCards].some((card) => getSelectedQuantity(card) > 0);
	if (!hasItems) {
		checkoutModal.hide();
		return;
	}

	productCards.forEach((card) => {
		const productId = card.dataset.productId;
		stock[productId] -= getSelectedQuantity(card);
		card.querySelector(".quantity-value").textContent = "0";
	});

	nameConfirmation.textContent = customerName ? `, ${customerName}` : "";
	orderForm.hidden = true;
	orderConfirmation.hidden = false;
	saveStock();
	refreshProducts();

	setTimeout(() => {
		checkoutModal.hide();
		orderForm.hidden = false;
		orderConfirmation.hidden = true;
		orderForm.reset();
		window.scrollTo({ top: 0, behavior: "smooth" });
	}, 1800);
});

checkoutModalElement.addEventListener("hidden.bs.modal", () => {
	orderForm.hidden = false;
	orderConfirmation.hidden = true;
});

refreshProducts();
