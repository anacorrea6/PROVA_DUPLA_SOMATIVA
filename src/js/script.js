// ==========================================
// SELEÇÃO DE ELEMENTOS DO DOM
// ==========================================

// Seleciona todos os cards de produtos na página
const productCards = document.querySelectorAll(".product-card");

// Elementos onde serão exibidos os resumos do pedido (no carrinho e no checkout)
const orderSummary = document.querySelector("#pedido-resumo");
const cartSummary = document.querySelector("#carrinho-resumo");

// Elementos do formulário de finalização e da tela de confirmação
const orderForm = document.querySelector("#pedido-form");
const orderConfirmation = document.querySelector("#pedido-confirmacao");
const nameConfirmation = document.querySelector("#nome-confirmacao");

// Badge/indicador com o número total de itens no carrinho
const cartCount = document.querySelector(".cart-count");

// Instância do Modal do Carrinho usando Bootstrap
const cartModalElement = document.querySelector("#cart-modal");
const cartModal = bootstrap.Modal.getOrCreateInstance(cartModalElement);

// Botão que avança do carrinho para a tela de pagamento/checkout
const goToCheckoutButton = document.querySelector("#go-to-checkout");

// Instância do Modal de Checkout usando Bootstrap
const checkoutModalElement = document.querySelector("#checkout-modal");
const checkoutModal = bootstrap.Modal.getOrCreateInstance(checkoutModalElement);

// ==========================================
// GERENCIAMENTO DE ESTOQUE E ESTADO INICIAL
// ==========================================

// Chave utilizada para salvar/buscar os dados no LocalStorage do navegador
const stockStorageKey = "charme-estoque";

// Recupera o estoque salvo no LocalStorage; se não existir, define como null
const storedStock = JSON.parse(localStorage.getItem(stockStorageKey) || "null");

// Objeto que armazenará a quantidade de estoque em memória durante a sessão
const stock = {};

// Inicializa o estoque: prioriza o valor do LocalStorage; caso contrário, usa o 'data-stock' do HTML
productCards.forEach((card) => {
	const productId = card.dataset.productId;
	stock[productId] = storedStock?.[productId] ?? Number(card.dataset.stock);
});

// ==========================================
// FUNÇÕES AUXILIARES E ATUALIZAÇÃO DA INTERFACE
// ==========================================

/**
 * Lê e retorna a quantidade de itens atualmente selecionada no card.
 */
function getSelectedQuantity(card) {
	return Number(card.querySelector(".quantity-value").textContent);
}

/**
 * Cria dinamicamente ou atualiza o texto contendo a quantidade disponível em estoque.
 */
function updateStockLabel(card) {
	let label = card.querySelector(".stock-label");
	
	// Se a tag <small> ainda não existir no card, ela é criada e inserida no DOM
	if (!label) {
		label = document.createElement("small");
		label.className = "stock-label";
		card.querySelector(".card-body").append(label);
	}
	
	label.textContent = `${stock[card.dataset.productId]} disponível(is)`;
}

/**
 * Atualiza o resumo da compra (itens e preços), o totalizador e habilita/desabilita o botão de checkout.
 */
function updateOrderSummary() {
	const selectedProducts = [];
	let totalItems = 0;

	// Percorre os cards para montar a lista de itens com quantidade > 0
	productCards.forEach((card) => {
		const quantity = getSelectedQuantity(card);
		totalItems += quantity;
		if (quantity > 0) {
			const name = card.querySelector(".card-title").textContent;
			const price = card.querySelector(".product-price").textContent;
			selectedProducts.push(`${name} - ${quantity} unidade(s) - ${price} cada`);
		}
	});

	// Converte a lista em elementos HTML <li>
	const summaryMarkup = selectedProducts.length
		? selectedProducts.map((product) => `<li>${product}</li>`).join("")
		: "<li>Nenhum produto selecionado.</li>";

	// Injeta a lista nos resumos, atualiza o contador do ícone e valida o botão de prosseguir
	orderSummary.innerHTML = summaryMarkup;
	cartSummary.innerHTML = summaryMarkup;
	cartCount.textContent = totalItems;
	goToCheckoutButton.disabled = totalItems === 0;
}

/**
 * Salva o estado atual do objeto 'stock' no LocalStorage.
 */
function saveStock() {
	localStorage.setItem(stockStorageKey, JSON.stringify(stock));
}

/**
 * Atualiza o estado visual de todos os produtos (rótulos de estoque, trava de botões e exibição dos cards).
 */
function refreshProducts() {
	productCards.forEach((card) => {
		const productId = card.dataset.productId;
		const quantity = getSelectedQuantity(card);
		const increaseButton = card.querySelector('[data-action="increase"]');

		// Atualiza o texto do estoque no card
		updateStockLabel(card);
		
		// Desabilita o botão de "+" se a quantidade selecionada atingir o limite em estoque
		increaseButton.disabled = quantity >= stock[productId];
		
		// Oculta o card caso o estoque do produto tenha se esgotado completamente (<= 0)
		card.classList.toggle("is-hidden", stock[productId] <= 0);
	});
	
	// Atualiza os modais e contadores do carrinho
	updateOrderSummary();
}

// ==========================================
// EVENT LISTENERS (INTERAÇÕES DO USUÁRIO)
// ==========================================

productCards.forEach((card) => {
	const control = card.querySelector(".quantity-control");
	const valueElement = card.querySelector(".quantity-value");

	// Delegação de evento para os botões de incremento e decremento (+ e -)
	control.addEventListener("click", (event) => {
		const button = event.target.closest(".quantity-button");
		if (!button) return;

		let quantity = getSelectedQuantity(card);
		
		// Incrementa respeitando o limite do estoque
		if (button.dataset.action === "increase" && quantity < stock[card.dataset.productId]) quantity += 1;
		// Decrementa sem permitir valores negativos
		if (button.dataset.action === "decrease" && quantity > 0) quantity -= 1;
		
		valueElement.textContent = quantity;
		refreshProducts();
	});

	// Evento do botão principal "Adicionar / Comprar" do produto
	card.querySelector(".order-button").addEventListener("click", () => {
		// Se estiver zerado, seleciona 1 unidade por padrão ao clicar em comprar
		if (getSelectedQuantity(card) === 0) valueElement.textContent = "1";
		refreshProducts();
		cartModal.show(); // Abre o modal do carrinho
	});
});

// Transiciona do modal do carrinho diretamente para o modal de checkout
goToCheckoutButton.addEventListener("click", () => {
	cartModal.hide();
	checkoutModal.show();
});

// Processamento do envio do formulário de finalização da compra
orderForm.addEventListener("submit", (event) => {
	event.preventDefault(); // Evita o recarregamento padrão da página
	
	const customerName = document.querySelector("#nome").value.trim();
	const hasItems = [...productCards].some((card) => getSelectedQuantity(card) > 0);
	
	// Caso tente enviar sem nenhum item selecionado, fecha o modal e interrompe
	if (!hasItems) {
		checkoutModal.hide();
		return;
	}

	// Subtrai os itens comprados do estoque e reseta os contadores dos cards
	productCards.forEach((card) => {
		const productId = card.dataset.productId;
		stock[productId] -= getSelectedQuantity(card);
		card.querySelector(".quantity-value").textContent = "0";
	});

	// Atualiza a mensagem de confirmação com o nome do comprador
	nameConfirmation.textContent = customerName ? `, ${customerName}` : "";
	
	// Oculta o formulário e exibe a mensagem de sucesso
	orderForm.hidden = true;
	orderConfirmation.hidden = false;
	
	// Persiste o novo estoque e atualiza a UI
	saveStock();
	refreshProducts();

	// Após 1,8 segundos, fecha o modal, restaura o formulário e rola a página para o topo
	setTimeout(() => {
		checkoutModal.hide();
		orderForm.hidden = false;
		orderConfirmation.hidden = true;
		orderForm.reset();
		window.scrollTo({ top: 0, behavior: "smooth" });
	}, 1800);
});

// Garante que a interface do modal volte ao estado inicial caso o usuário o feche sem finalizar
checkoutModalElement.addEventListener("hidden.bs.modal", () => {
	orderForm.hidden = false;
	orderConfirmation.hidden = true;
});

// ==========================================
// INICIALIZAÇÃO DA APLICAÇÃO
// ==========================================

// Executa a primeira renderização para ajustar estoques e contadores no carregamento da página
refreshProducts();