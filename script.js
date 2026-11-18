const STORAGE_KEY = "reliefConnectDataV1";

const defaultData = {
    requests: [
        {
            id: "RQ101",
            name: "Amit Sharma",
            contact: "98XXXXXX10",
            location: "Hisar",
            resource: "Food Packets",
            people: 120,
            priority: "High",
            status: "Pending"
        },
        {
            id: "RQ102",
            name: "Neha Verma",
            contact: "98XXXXXX21",
            location: "Panipat",
            resource: "Water Bottles",
            people: 80,
            priority: "Medium",
            status: "In Progress"
        }
    ],

    resources: [
        { id: "RS101", name: "Food Packets", quantity: 500, unit: "Packets" },
        { id: "RS102", name: "Water Bottles", quantity: 250, unit: "Bottles" },
        { id: "RS103", name: "Medical Kits", quantity: 60, unit: "Kits" },
        { id: "RS104", name: "Clothing Kits", quantity: 40, unit: "Kits" },
        { id: "RS105", name: "Shelter Kits", quantity: 25, unit: "Kits" }
    ],

    areas: [
        { id: "AR101", location: "Hisar", type: "Flood", people: 120, impact: "High" },
        { id: "AR102", location: "Panipat", type: "Storm", people: 80, impact: "Medium" }
    ],

    allocations: [],

    volunteers: [
        { id: "V101", name: "Priya", contact: "98XXXXXX11", skill: "First Aid", location: "Hisar", status: "Available" },
        { id: "V102", name: "Karan", contact: "98XXXXXX22", skill: "Food Distribution", location: "Panipat", status: "Assigned" }
    ]
};

function loadData() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        return saved ? JSON.parse(saved) : structuredClone(defaultData);
    } catch (error) {
        return structuredClone(defaultData);
    }
}

let data = loadData();

function saveData() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function nextId(prefix, collection) {
    const max = collection.reduce((highest, item) => {
        const number = Number(String(item.id).replace(/\D/g, "")) || 100;
        return Math.max(highest, number);
    }, 100);

    return prefix + (max + 1);
}

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[char]);
}

function showToast(message) {
    const toast = document.getElementById("toast");
    toast.textContent = message;
    toast.classList.add("show");

    clearTimeout(showToast.timer);

    showToast.timer = setTimeout(() => {
        toast.classList.remove("show");
    }, 2500);
}

function badge(value) {
    const className = String(value).toLowerCase().replace(/\s+/g, "-");

    return `<span class="badge ${className}">
        ${escapeHTML(value)}
    </span>`;
}

function actionButtons(type, id) {
    return `
        <button class="action-btn"
            data-action="edit"
            data-type="${type}"
            data-id="${id}">Edit</button>

        <button class="action-btn delete"
            data-action="delete"
            data-type="${type}"
            data-id="${id}">Delete</button>
    `;
}

function renderDashboard() {
    document.getElementById("statRequests").textContent =
        data.requests.length;

    document.getElementById("statResources").textContent =
        data.resources.reduce((sum, item) => sum + Number(item.quantity), 0);

    document.getElementById("statVolunteers").textContent =
        data.volunteers.filter(v =>
            v.status === "Available" || v.status === "Assigned"
        ).length;

    document.getElementById("statPending").textContent =
        data.requests.filter(r => r.status !== "Completed").length;

    const recent = [...data.requests].slice(-5).reverse();

    document.querySelector("#dashboardRecent tbody").innerHTML =
        recent.length
            ? recent.map(r => `
                <tr>
                    <td>${escapeHTML(r.id)}</td>
                    <td>${escapeHTML(r.name)}</td>
                    <td>${escapeHTML(r.location)}</td>
                    <td>${escapeHTML(r.resource)}</td>
                    <td>${badge(r.priority)}</td>
                    <td>${badge(r.status)}</td>
                </tr>
            `).join("")
            : `<tr><td colspan="6">No requests found.</td></tr>`;
}

function renderRequests() {
    const tbody = document.querySelector("#requestsTable tbody");

    tbody.innerHTML = data.requests.map(r => `
        <tr>
            <td>${escapeHTML(r.id)}</td>
            <td>${escapeHTML(r.name)}</td>
            <td>${escapeHTML(r.contact)}</td>
            <td>${escapeHTML(r.location)}</td>
            <td>${escapeHTML(r.resource)}</td>
            <td>${Number(r.people)}</td>
            <td>${badge(r.priority)}</td>
            <td>
                <select class="inline-select"
                    data-status="request"
                    data-id="${r.id}">
                    <option ${r.status === "Pending" ? "selected" : ""}>Pending</option>
                    <option ${r.status === "In Progress" ? "selected" : ""}>In Progress</option>
                    <option ${r.status === "Completed" ? "selected" : ""}>Completed</option>
                </select>
            </td>
            <td>${actionButtons("requests", r.id)}</td>
        </tr>
    `).join("") || `<tr><td colspan="9">No requests found.</td></tr>`;
}

function renderResources() {
    const tbody = document.querySelector("#resourcesTable tbody");

    tbody.innerHTML = data.resources.map(r => `
        <tr>
            <td>${escapeHTML(r.id)}</td>
            <td>${escapeHTML(r.name)}</td>
            <td>${Number(r.quantity)}</td>
            <td>${escapeHTML(r.unit)}</td>
            <td>${badge(Number(r.quantity) <= 10 ? "Low Stock" : "In Stock")}</td>
            <td>${actionButtons("resources", r.id)}</td>
        </tr>
    `).join("") || `<tr><td colspan="6">No resources found.</td></tr>`;

    document.getElementById("resourceUnits").textContent =
        data.resources.reduce((sum, r) => sum + Number(r.quantity), 0);

    document.getElementById("resourceCategories").textContent =
        data.resources.length;

    document.getElementById("lowStock").textContent =
        data.resources.filter(r => Number(r.quantity) <= 10).length;

    const select = document.getElementById("allocationResource");
    const current = select.value;

    select.innerHTML = `<option value="">Select Resource</option>` +
        data.resources.map(r => `
            <option value="${escapeHTML(r.name)}">
                ${escapeHTML(r.name)} (${Number(r.quantity)} ${escapeHTML(r.unit)})
            </option>
        `).join("");

    if (data.resources.some(r => r.name === current)) {
        select.value = current;
    }
}

function renderAreas() {
    const tbody = document.querySelector("#areasTable tbody");

    tbody.innerHTML = data.areas.map(a => `
        <tr>
            <td>${escapeHTML(a.id)}</td>
            <td>${escapeHTML(a.location)}</td>
            <td>${escapeHTML(a.type)}</td>
            <td>${Number(a.people)}</td>
            <td>${badge(a.impact)}</td>
            <td>${actionButtons("areas", a.id)}</td>
        </tr>
    `).join("") || `<tr><td colspan="6">No areas found.</td></tr>`;

    document.getElementById("areaOptions").innerHTML =
        data.areas.map(a => `
            <option value="${escapeHTML(a.location)}"></option>
        `).join("");
}

function renderAllocations() {
    const tbody = document.querySelector("#allocationTable tbody");

    tbody.innerHTML = data.allocations.map(a => `
        <tr>
            <td>${escapeHTML(a.id)}</td>
            <td>${escapeHTML(a.location)}</td>
            <td>${escapeHTML(a.resource)}</td>
            <td>${Number(a.quantity)}</td>
            <td>${badge(a.priority)}</td>
            <td>${badge(a.status)}</td>
            <td>${actionButtons("allocations", a.id)}</td>
        </tr>
    `).join("") || `<tr><td colspan="7">No allocations found.</td></tr>`;
}

function renderVolunteers() {
    const tbody = document.querySelector("#volunteersTable tbody");

    tbody.innerHTML = data.volunteers.map(v => `
        <tr>
            <td>${escapeHTML(v.id)}</td>
            <td>${escapeHTML(v.name)}</td>
            <td>${escapeHTML(v.contact)}</td>
            <td>${escapeHTML(v.skill)}</td>
            <td>${escapeHTML(v.location)}</td>
            <td>
                <select class="inline-select"
                    data-status="volunteer"
                    data-id="${v.id}">
                    <option ${v.status === "Available" ? "selected" : ""}>Available</option>
                    <option ${v.status === "Assigned" ? "selected" : ""}>Assigned</option>
                    <option ${v.status === "Unavailable" ? "selected" : ""}>Unavailable</option>
                </select>
            </td>
            <td>${actionButtons("volunteers", v.id)}</td>
        </tr>
    `).join("") || `<tr><td colspan="7">No volunteers found.</td></tr>`;

    document.getElementById("totalVolunteers").textContent =
        data.volunteers.length;

    document.getElementById("availableVolunteers").textContent =
        data.volunteers.filter(v => v.status === "Available").length;

    document.getElementById("assignedVolunteers").textContent =
        data.volunteers.filter(v => v.status === "Assigned").length;
}

function renderAll() {
    renderDashboard();
    renderRequests();
    renderResources();
    renderAreas();
    renderAllocations();
    renderVolunteers();
    applySearch();
}

function applySearch() {
    document.querySelectorAll(".table-search").forEach(input => {
        const table = document.getElementById(input.dataset.search);
        if (!table) return;

        const term = input.value.toLowerCase();

        table.querySelectorAll("tbody tr").forEach(row => {
            row.style.display =
                row.textContent.toLowerCase().includes(term) ? "" : "none";
        });
    });
}

function commit(message) {
    saveData();
    renderAll();
    if (message) showToast(message);
}

/* RELIEF REQUEST FORM */

document.getElementById("requestForm").addEventListener("submit", event => {
    event.preventDefault();

    data.requests.push({
        id: nextId("RQ", data.requests),
        name: document.getElementById("requestName").value.trim(),
        contact: document.getElementById("requestContact").value.trim(),
        location: document.getElementById("requestLocation").value.trim(),
        resource: document.getElementById("requestResource").value,
        priority: document.getElementById("requestPriority").value,
        people: Number(document.getElementById("requestPeople").value),
        status: "Pending"
    });

    event.target.reset();
    commit("Relief request submitted successfully.");
});

/* RESOURCE FORM */

document.getElementById("resourceForm").addEventListener("submit", event => {
    event.preventDefault();

    const name = document.getElementById("resourceName").value.trim();
    const quantity = Number(document.getElementById("resourceQuantity").value);
    const unit = document.getElementById("resourceUnit").value;

    const existing = data.resources.find(r =>
        r.name.toLowerCase() === name.toLowerCase() && r.unit === unit
    );

    if (existing) {
        existing.quantity += quantity;
    } else {
        data.resources.push({
            id: nextId("RS", data.resources),
            name,
            quantity,
            unit
        });
    }

    event.target.reset();
    commit("Resource inventory updated.");
});

/* DISASTER AREA FORM */

document.getElementById("areaForm").addEventListener("submit", event => {
    event.preventDefault();

    data.areas.push({
        id: nextId("AR", data.areas),
        location: document.getElementById("areaName").value.trim(),
        type: document.getElementById("areaType").value,
        people: Number(document.getElementById("areaPeople").value),
        impact: document.getElementById("areaImpact").value
    });

    event.target.reset();
    commit("Affected area added successfully.");
});

/* RESOURCE ALLOCATION FORM */

document.getElementById("allocationForm").addEventListener("submit", event => {
    event.preventDefault();

    const location = document.getElementById("allocationLocation").value.trim();
    const resourceName = document.getElementById("allocationResource").value;
    const quantity = Number(document.getElementById("allocationQuantity").value);
    const priority = document.getElementById("allocationPriority").value;

    const resource = data.resources.find(r => r.name === resourceName);

    if (!resource) {
        showToast("Please select a valid resource.");
        return;
    }

    if (quantity <= 0 || resource.quantity < quantity) {
        showToast("Invalid quantity or insufficient stock.");
        return;
    }

    resource.quantity -= quantity;

    data.allocations.push({
        id: nextId("AL", data.allocations),
        location,
        resource: resourceName,
        quantity,
        priority,
        status: "Completed"
    });

    event.target.reset();
    commit("Resources allocated and stock updated.");
});

/* VOLUNTEER FORM */

document.getElementById("volunteerForm").addEventListener("submit", event => {
    event.preventDefault();

    data.volunteers.push({
        id: nextId("V", data.volunteers),
        name: document.getElementById("volunteerName").value.trim(),
        contact: document.getElementById("volunteerContact").value.trim(),
        skill: document.getElementById("volunteerSkill").value,
        location: document.getElementById("volunteerLocation").value.trim(),
        status: document.getElementById("volunteerAvailability").value
    });

    event.target.reset();
    commit("Volunteer registered successfully.");
});

/* EDIT AND DELETE */

document.addEventListener("click", event => {
    const button = event.target.closest("button[data-action]");
    if (!button) return;

    const { action, type, id } = button.dataset;
    const collection = data[type];
    const item = collection.find(record => record.id === id);

    if (!item) return;

    if (action === "delete") {
        if (!confirm("Are you sure you want to delete this record?")) return;

        if (type === "allocations" && item.status === "Completed") {
            const resource = data.resources.find(r => r.name === item.resource);
            if (resource) {
                resource.quantity += Number(item.quantity);
            }
        }

        collection.splice(collection.indexOf(item), 1);
        commit("Record deleted.");
    }

    if (action === "edit") {
        if (type === "resources") {
            const value = prompt("Enter updated quantity:", item.quantity);
            if (value === null) return;

            const quantity = Number(value);

            if (!Number.isInteger(quantity) || quantity < 0) {
                showToast("Enter a valid quantity.");
                return;
            }

            item.quantity = quantity;
        }

        if (type === "areas") {
            const value = prompt("Enter updated people count:", item.people);
            if (value === null) return;

            const people = Number(value);

            if (!Number.isInteger(people) || people < 1) {
                showToast("Enter a valid number.");
                return;
            }

            item.people = people;
        }

        if (type === "requests") {
            const value = prompt("Enter status: Pending, In Progress or Completed", item.status);
            if (value === null) return;

            if (!["Pending", "In Progress", "Completed"].includes(value)) {
                showToast("Invalid status.");
                return;
            }

            item.status = value;
        }

        if (type === "volunteers") {
            const value = prompt("Enter status: Available, Assigned or Unavailable", item.status);
            if (value === null) return;

            if (!["Available", "Assigned", "Unavailable"].includes(value)) {
                showToast("Invalid status.");
                return;
            }

            item.status = value;
        }

        if (type === "allocations") {
            const value = prompt("Enter status: Completed or Pending", item.status);
            if (value === null) return;

            if (!["Completed", "Pending"].includes(value)) {
                showToast("Invalid status.");
                return;
            }

            item.status = value;
        }

        commit("Record updated.");
    }
});

/* QUICK STATUS UPDATE */

document.addEventListener("change", event => {
    const select = event.target.closest("select[data-status]");
    if (!select) return;

    const type = select.dataset.status === "request"
        ? "requests"
        : "volunteers";

    const item = data[type].find(record => record.id === select.dataset.id);

    if (item) {
        item.status = select.value;
        commit("Status updated.");
    }
});

/* SEARCH */

document.querySelectorAll(".table-search").forEach(input => {
    input.addEventListener("input", applySearch);
});

/* INITIAL LOAD */

renderAll();