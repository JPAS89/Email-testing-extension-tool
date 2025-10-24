// Navbar logic
document.querySelectorAll("ul li a").forEach(link => {
  link.addEventListener("click", () => {
    // remove active from all links
    document.querySelectorAll("ul li a").forEach(l => l.classList.remove("active"));
    // add active to clicked
    link.classList.add("active");

    // hide all sections
    document.querySelectorAll(".section").forEach(sec => sec.classList.remove("active"));
    // show selected section
    document.getElementById(link.dataset.section).classList.add("active");
  });
});
