// Constants
const TAX_RATE = 4.712 / 100; // 4.712%

// State management
let items = [];
let editingId = null;

// DOM Elements
const itemForm = document.getElementById('item-form');
const itemsContainer = document.getElementById('items-container');
const importInput = document.getElementById('import-input');
const nameInput = document.getElementById('item-name');
const priceInput = document.getElementById('item-price');
const quantityInput = document.getElementById('item-quantity');

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    itemForm.addEventListener('submit', handleAddItem);
    importInput.addEventListener('change', handleImport);
});

// Handle adding/updating items
function handleAddItem(e) {
    e.preventDefault();
    
    const item = {
        id: editingId || Date.now(),
        name: nameInput.value,
        price: parseFloat(priceInput.value),
        quantity: parseInt(quantityInput.value),
        checked: editingId ? (items.find(i => i.id === editingId)?.checked || false) : false
    };
    
    if (editingId) {
        items = items.map(i => i.id === editingId ? item : i);
        editingId = null;
        itemForm.querySelector('button').textContent = 'Add Item';
    } else {
        items.push(item);
    }
    
    // Reset form
    nameInput.value = '';
    priceInput.value = '';
    quantityInput.value = '1';
    
    renderItems();
    updateTotals();
}

// Edit item
function editItem(id) {
    const item = items.find(i => i.id === id);
    if (!item) return;
    
    nameInput.value = item.name;
    priceInput.value = item.price;
    quantityInput.value = item.quantity;
    editingId = id;
    
    itemForm.querySelector('button').textContent = 'Update Item';
    nameInput.focus();
}

// Toggle item checked state
function toggleChecked(id) {
    items = items.map(item => {
        if (item.id === id) {
            return { ...item, checked: !item.checked };
        }
        return item;
    }).sort((a, b) => {
        // Sort checked items to bottom
        if (a.checked === b.checked) return 0;
        return a.checked ? 1 : -1;
    });
    
    renderItems();
    updateTotals();
}

// Render items list
function renderItems() {
    itemsContainer.innerHTML = items.map(item => `
        <div class="item ${item.checked ? 'checked' : ''}" data-id="${item.id}">
            <div class="item-details" onclick="editItem(${item.id})">
                <span class="item-name">${item.name}</span>
                <span class="item-price">$${item.price.toFixed(2)}</span>
                <span class="item-quantity">× ${item.quantity}</span>
                <span class="item-total">$${(item.price * item.quantity).toFixed(2)}</span>
            </div>
            <div class="item-actions">
                <input type="checkbox" 
                       class="item-checkbox" 
                       ${item.checked ? 'checked' : ''} 
                       onclick="event.stopPropagation(); toggleChecked(${item.id})">
                <button class="delete-btn" onclick="event.stopPropagation(); deleteItem(${item.id})">×</button>
            </div>
        </div>
    `).join('');
}

// Delete item
function deleteItem(id) {
    items = items.filter(item => item.id !== id);
    if (editingId === id) {
        editingId = null;
        nameInput.value = '';
        priceInput.value = '';
        quantityInput.value = '1';
        itemForm.querySelector('button').textContent = 'Add Item';
    }
    renderItems();
    updateTotals();
}

// Update totals
function updateTotals() {
    const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const tax = subtotal * TAX_RATE;
    const total = subtotal + tax;
    
    // Update header totals
    document.getElementById('header-subtotal').textContent = `$${subtotal.toFixed(2)}`;
    document.getElementById('header-tax').textContent = `$${tax.toFixed(2)}`;
    document.getElementById('header-total').textContent = `$${total.toFixed(2)}`;
}

// Export to CSV
function exportToCSV() {
    const headers = ['Name', 'Price', 'Quantity', 'In Cart'];
    const csvContent = [
        headers.join(','),
        ...items.map(item => 
            `${item.name},$${item.price.toFixed(2)},${item.quantity},${item.checked ? 'Yes' : 'No'}`
        )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `shopping-list-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
}

// Import from CSV
function handleImport(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        const text = e.target.result;
        const rows = text.split('\n');
        
        // Skip header row
        const newItems = rows.slice(1)
            .filter(row => row.trim()) // Skip empty rows
            .map(row => {
                const [name, price, quantity, checked] = row.split(',');
                return {
                    id: Date.now() + Math.random(), // Ensure unique ID
                    name: name,
                    price: parseFloat(price.replace('$', '')),
                    quantity: parseInt(quantity),
                    checked: checked?.trim().toLowerCase() === 'yes'
                };
            });
        
        items = [...items, ...newItems].sort((a, b) => {
            if (a.checked === b.checked) return 0;
            return a.checked ? 1 : -1;
        });
        renderItems();
        updateTotals();
        
        // Reset file input
        event.target.value = '';
    };
    
    reader.readAsText(file);
} 