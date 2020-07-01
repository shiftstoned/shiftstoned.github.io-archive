


// Header JS
  // toggle menu
  // initial "header.dataset.state == 'closed'"
  const navMenu = document.getElementById('newNavigation-menu');
  toggleMenu = () => {
    if (navMenu.dataset.state === "closed") {
        navMenu.dataset.state = "open";
    }
    else {
        navMenu.dataset.state = "closed";
    }
  }