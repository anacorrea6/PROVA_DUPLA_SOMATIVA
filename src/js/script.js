const quantityControls = document.querySelectorAll(".quantity-control");
const orderSummary = document.querySelector("#pedido-resumo");
const orderForm = document.querySelector("#pedido-form");
const orderConfirmation = document.querySelector("#pedido-confirmacao");
const nameConfirmation = document.querySelector("#nome-confirmacao");

function updateOrderSummary() {
	const selectedProducts = [];

	quantityControls.forEach((control) => {
		const quantity = Number(control.querySelector(".quantity-value").textContent);

		if (quantity > 0) {
			const card = control.closest(".card");
			const name = card.querySelector(".card-title").textContent;
			const price = card.querySelector(".product-price").textContent;
			selectedProducts.push(`${name} - ${quantity} unidade(s) - ${price} cada`);
		}
	});

	orderSummary.innerHTML = selectedProducts.length
		? selectedProducts.map((product) => `<li>${product}</li>`).join("")
		: "<li>Nenhum produto selecionado.</li>";
}

quantityControls.forEach((control) => {
	const valueElement = control.querySelector(".quantity-value");
	let quantity = 0;

	control.addEventListener("click", (event) => {
		const button = event.target.closest(".quantity-button");

		if (!button) {
			return;
		}

		if (button.dataset.action === "increase") {
			quantity += 1;
		} else if (quantity > 0) {
			quantity -= 1;
		}

		valueElement.textContent = quantity;
		updateOrderSummary();
	});
});

orderForm.addEventListener("submit", (event) => {
	event.preventDefault();

	const customerName = document.querySelector("#nome").value.trim();
	nameConfirmation.textContent = customerName ? `, ${customerName}` : "";
	orderForm.hidden = true;
	orderConfirmation.hidden = false;
	orderConfirmation.scrollIntoView({ behavior: "smooth", block: "center" });
});
