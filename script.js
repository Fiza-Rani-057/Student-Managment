const { createClient } = supabase;
const supabaseURL = 'https://fyitjrqdacpgpoehmrfn.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ5aXRqcnFkYWNwZ3BvZWhtcmZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAxNDUyMTAsImV4cCI6MjEwNTcyMTIxMH0.EHa1IEnDniSB1y_bDpZq2ycI64pqukv8Y_DpGz-aLVg';
const supabaseClient = createClient(supabaseURL, supabaseKey);
// DOM Elements
const studentForm = document.getElementById("student-form");
const studentIdInput = document.getElementById("student-id");
const studentNameInput = document.getElementById("student-name");
const studentEmailInput = document.getElementById("student-email");
const studentCourseInput = document.getElementById("student-course");
const submitBtn = document.getElementById("submit-btn");
const cancelEditBtn = document.getElementById("cancel-edit-btn");
const formTitle = document.getElementById("form-title");
const formModeBadge = document.getElementById("form-mode-badge");

const studentsTableBody = document.getElementById("students-table-body");
const studentCountBadge = document.getElementById("student-count");
const searchInput = document.getElementById("search-input");
const toastContainer = document.getElementById("toast-container");

// Modals
const viewModal = document.getElementById("view-modal");
const closeViewModalBtn = document.getElementById("close-view-modal");
const viewName = document.getElementById("view-name");
const viewEmail = document.getElementById("view-email");
const viewCourse = document.getElementById("view-course");

const deleteModal = document.getElementById("delete-modal");
const confirmDeleteBtn = document.getElementById("confirm-delete-btn");
const cancelDeleteBtn = document.getElementById("cancel-delete-btn");

// In-Memory Database Array (Yahan aap apni database/API connectivity kar sakti hain)
let studentsList = [];
let deleteTargetId = null;

// Toast Notification Helper
function showToast(message, type = "success") {
    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    const icon = type === "success" ? "fa-circle-check" : "fa-circle-exclamation";
    toast.innerHTML = `<i class="fa-solid ${icon}"></i> <span>${message}</span>`;
    toastContainer.appendChild(toast);
    setTimeout(() => toast.remove(), 3500);
}

// Form Validation
function validateForm() {
    let isValid = true;
    
    // Name validation
    const nameGroup = studentNameInput.closest(".form-group");
    if (!studentNameInput.value.trim()) {
        nameGroup.classList.add("error");
        isValid = false;
    } else {
        nameGroup.classList.remove("error");
    }

    // Email validation
    const emailGroup = studentEmailInput.closest(".form-group");
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(studentEmailInput.value.trim())) {
        emailGroup.classList.add("error");
        isValid = false;
    } else {
        emailGroup.classList.remove("error");
    }

    // Course validation
    const courseGroup = studentCourseInput.closest(".form-group");
    if (!studentCourseInput.value.trim()) {
        courseGroup.classList.add("error");
        isValid = false;
    } else {
        courseGroup.classList.remove("error");
    }

    return isValid;
}

// Render Table Function
function renderTable(data = studentsList) {
    const query = searchInput.value.toLowerCase().trim();
    const filtered = data.filter(s => 
        s.name.toLowerCase().includes(query) ||
        s.email.toLowerCase().includes(query) ||
        s.course.toLowerCase().includes(query)
    );

    studentCountBadge.textContent = `${filtered.length} Student${filtered.length === 1 ? '' : 's'}`;

    if (filtered.length === 0) {
        studentsTableBody.innerHTML = `<tr><td colspan="4" class="text-center empty-state">No student records found.</td></tr>`;
        return;
    }

    studentsTableBody.innerHTML = filtered.map(student => `
        <tr>
            <td><strong>${escapeHtml(student.name)}</strong></td>
            <td>${escapeHtml(student.email)}</td>
            <td><span class="badge">${escapeHtml(student.course)}</span></td>
            <td class="text-right">
                <div class="action-btns">
                    <button class="icon-btn view-btn" onclick="window.viewStudent('${student.id}')" title="View Details">
                        <i class="fa-solid fa-eye"></i>
                    </button>
                    <button class="icon-btn edit-btn" onclick="window.editStudent('${student.id}')" title="Edit Student">
                        <i class="fa-solid fa-pen"></i>
                    </button>
                    <button class="icon-btn delete-btn" onclick="window.promptDelete('${student.id}')" title="Delete Student">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

// XSS Sanitizer Helper
function escapeHtml(str) {
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

// Form Submit Handler (Create or Update)

studentForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    const id = studentIdInput.value;

    const studentData = {
        name: studentNameInput.value.trim(),
        email: studentEmailInput.value.trim(),
        course: studentCourseInput.value.trim()
    };

    let result;

    if (id) {
        // Update existing student
        result = await supabaseClient
            .from("stdtable")
            .update(studentData)
            .eq("id", id);
    } else {
        // Add new student
        result = await supabaseClient
            .from("stdtable")
            .insert([studentData]);
    }

    if (result.error) {
        console.log(result.error);
        showToast("Error saving student!", "error");
        return;
    }

    if (id) {
        showToast("Student updated successfully!");
    } else {
        showToast("Student added successfully!");
    }

    resetForm();
    await getstd();
});

async function getstd() {
    const { data, error } = await supabaseClient
        .from("stdtable")
        .select("*");

    if (error) {
        console.log("There is an error:", error);
        return;
    }

    studentsList = data;
    renderTable();
}
// View Student Details
window.viewStudent = function(id) {
    const student = studentsList.find(s => String(s.id) === String(id));

    if (!student) return;

    viewName.textContent = student.name;
    viewEmail.textContent = student.email;
    viewCourse.textContent = student.course;

    viewModal.classList.remove("hidden");
};

closeViewModalBtn.addEventListener("click", () => viewModal.classList.add("hidden"));

// Edit Student Trigger
window.editStudent = function(id) {
    const student = studentsList.find(
        s => String(s.id) === String(id)
    );

    if (!student) {
        console.log("Student not found:", id);
        return;
    }

    studentIdInput.value = student.id;
    studentNameInput.value = student.name;
    studentEmailInput.value = student.email;
    studentCourseInput.value = student.course;

    formTitle.innerHTML = '<i class="fa-solid fa-user-pen"></i> Edit Student';
    formModeBadge.textContent = "Editing Mode";
    submitBtn.innerHTML = '<i class="fa-solid fa-check"></i> Update Record';

    cancelEditBtn.classList.remove("hidden");

    console.log("Editing student ID:", studentIdInput.value);

    window.scrollTo({ top: 0, behavior: "smooth" });
};

// Cancel Edit Mode
cancelEditBtn.addEventListener("click", resetForm);

function resetForm() {
    studentForm.reset();
    studentIdInput.value = "";
    formTitle.innerHTML = `<i class="fa-solid fa-user-plus"></i> Add New Student`;
    formModeBadge.textContent = "New Record";
    submitBtn.innerHTML = `<i class="fa-solid fa-floppy-disk"></i> Save Student`;
    cancelEditBtn.classList.add("hidden");
    document.querySelectorAll(".form-group").forEach(g => g.classList.remove("error"));
}

// Delete Prompt
window.promptDelete = function(id) {
    deleteTargetId = id;
    deleteModal.classList.remove("hidden");
};

cancelDeleteBtn.addEventListener("click", () => {
    deleteTargetId = null;
    deleteModal.classList.add("hidden");
});

confirmDeleteBtn.addEventListener("click", async () => {
    if (!deleteTargetId) return;

    const { error } = await supabaseClient
        .from("stdtable")
        .delete()
        .eq("id", deleteTargetId);

    if (error) {
        console.log(error);
        showToast("Delete failed!", "error");
        return;
    }

    showToast("Student deleted successfully!");

    deleteTargetId = null;
    deleteModal.classList.add("hidden");

    await getstd();
});

// Search Filter
searchInput.addEventListener("input", () => renderTable());
