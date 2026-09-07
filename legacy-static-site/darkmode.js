const darkModeToggle = document.getElementById('darkModeToggle');

function updateToggleLabel() {
  if (!darkModeToggle) return;
  const isDark = document.body.classList.contains('dark-mode');
  darkModeToggle.innerHTML = isDark
    ? '<i class="fas fa-sun"></i> Mode clair'
    : '<i class="fas fa-moon"></i> Mode sombre';
}

// Récupérer le mode depuis localStorage
if (localStorage.getItem('dark-mode') === 'enabled') {
  document.body.classList.add('dark-mode');
}
updateToggleLabel();

darkModeToggle?.addEventListener('click', () => {
  document.body.classList.toggle('dark-mode');

  // Stocker le choix
  if (document.body.classList.contains('dark-mode')) {
    localStorage.setItem('dark-mode', 'enabled');
  } else {
    localStorage.setItem('dark-mode', 'disabled');
  }
  updateToggleLabel();
});
