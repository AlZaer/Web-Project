document.getElementById("login-form").addEventListener("submit", function(event) {
    event.preventDefault();

    const email = document.getElementById("loginEmailInput").value;
    const password = document.getElementById("LoginPasswordInput").value;

    console.log("Sending data:", email, password);

    fetch("/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
    })
    .then(response => response.json())
    .then(data => {
        console.log("Responce", data);
        if (data.success) {
            window.location.href = "clipboard.html";
        } else {
            alert(data.message || "Login failed");
        }
    })
    .catch(error => {
        console.error("Error:", error);
        alert("An error happened");
    });
});