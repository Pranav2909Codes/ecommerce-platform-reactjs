export function validateField(name, value) {
    const val = typeof value === "string" ? value.trim() : "";
    if (!val) {
        return "This field is required";
    }

    if (name === "email") {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(val)) {
            return "Please enter a valid email address";
        }
    }

    if (name === "phone") {
        const phoneDigits = val.replace(/\D/g, "");
        const isPhoneCharsValid = /^[+]?[0-9\s\-()]+$/.test(val);
        if (!isPhoneCharsValid || phoneDigits.length < 7 || phoneDigits.length > 15) {
            return "Please enter a valid phone number";
        }
    }

    return "";
}

export function validateForm(form) {
    const errors = {};
    const fields = [
        "firstName",
        "lastName",
        "email",
        "phone",
        "address",
        "city",
        "zipCode",
        "country",
    ];

    fields.forEach((field) => {
        const error = validateField(field, form[field]);
        if (error) {
            errors[field] = error;
        }
    });

    return errors;
}
