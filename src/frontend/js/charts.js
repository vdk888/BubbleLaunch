document.addEventListener("DOMContentLoaded", () => {
  const sliderWrapper = document.querySelector(".charts-slider-wrapper");
  const slider = document.querySelector(".charts-slider");
  const slides = document.querySelectorAll(".chart-slide");
  const dotsContainer = document.querySelector(".slider-dots");
  const descriptionItems = document.querySelectorAll(".chart-description-item");
  const insightTile = document.querySelector(".insight-tile");

  if (!slider || !slides.length || !sliderWrapper) {
    return;
  }

  let currentIndex = 0;
  let charts = [];
  let chartsInitialized = false;
  let slideInterval;
  const slideDuration = 5000;

  // --- Helper Functions (defined at top level of DOMContentLoaded) ---

  const showSlide = (index) => {
    currentIndex = index;
    updateSlider();
  };

  const updateSlider = () => {
    const slideWidth = slides[0].offsetWidth;
    const computedStyle = window.getComputedStyle(slider);
    const gap = parseFloat(computedStyle.getPropertyValue("gap"));
    const offset = currentIndex * (slideWidth + gap);
    slider.style.transform = `translateX(-${offset}px)`;
    updateDots();
    updateDescription();
    updateSlideAnimations();
  };

  const updateDots = () => {
    const dots = document.querySelectorAll(".slider-dot");
    dots.forEach((dot, i) =>
      dot.classList.toggle("active", i === currentIndex),
    );
  };

  const updateDescription = () => {
    descriptionItems.forEach((item, i) => {
      item.classList.toggle("active-description", i === currentIndex);
    });
  };

  const updateSlideAnimations = () => {
    slides.forEach((slide, i) => {
        slide.classList.toggle("active-slide", i === currentIndex);
    });
  };

  const createDots = () => {
    if (!dotsContainer) return;
    dotsContainer.innerHTML = "";
    slides.forEach((_, i) => {
      const dot = document.createElement("button");
      dot.classList.add("slider-dot");
      dot.setAttribute("aria-label", `Go to slide ${i + 1}`);
      dot.addEventListener("click", () => {
        showSlide(i);
        resetInterval();
      });
      dotsContainer.appendChild(dot);
    });
  };

  const startInterval = () => {
    clearInterval(slideInterval);
    slideInterval = setInterval(() => {
      currentIndex = (currentIndex + 1) % slides.length;
      updateSlider();
    }, slideDuration);
  };

  const resetInterval = () => {
    startInterval();
  };

  const typeInsight = (element, text, callback) => {
    let charIndex = 0;
    let currentHtml = ""; // This will build the HTML string
    element.innerHTML = ""; // Clear content initially
    element.style.opacity = 1; // Ensure element is visible

    function typeNextCharInsight() {
      if (charIndex < text.length) {
        if (text[charIndex] === '<') {
          // Found the start of an HTML tag
          const tagEndIndex = text.indexOf('>', charIndex);
          if (tagEndIndex !== -1) {
            // Extract the full tag (e.g., "<b>" or "</b>")
            const tag = text.substring(charIndex, tagEndIndex + 1);
            currentHtml += tag; // Add the whole tag to the HTML string
            charIndex = tagEndIndex + 1; // Move index past the tag
          } else {
            // Malformed tag, treat as regular character (shouldn't happen with valid HTML)
            currentHtml += text.charAt(charIndex);
            charIndex++;
          }
        } else {
          // It's a regular character, add it
          currentHtml += text.charAt(charIndex);
          charIndex++;
        }

        element.innerHTML = currentHtml; // Update the element's content
        setTimeout(typeNextCharInsight, 20); // Adjust typing speed here
      } else {
        // All characters typed, call callback if provided
        if (callback) {
          callback();
        }
      }
    }
    typeNextCharInsight(); // Start the typing animation
  };

  let insightAnimationRunning = false;
  let insightAnimationTimeout;
  let insightAnimationCompleted = false;
  let isHoveringInsights = false;

  // Function to show static content initially
  const showStaticInsights = () => {
    const insightItems = document.querySelectorAll(".insight-item");
    const lang = document.documentElement.lang || "en";
    
    insightItems.forEach((item) => {
      const key = item.getAttribute("data-translate");
      const text = translations[key][lang];
      item.innerHTML = text;
      item.style.opacity = 1;
    });
  };

  const initKeyInsightsAnimation = () => {
    if (insightAnimationRunning || insightAnimationCompleted) return; // Prevent re-triggering if already running or completed
    insightAnimationRunning = true;

    const insightItems = document.querySelectorAll(".insight-item");
    const lang = document.documentElement.lang || "en";

    // Clear existing content and reset opacity for all items
    insightItems.forEach((item) => {
      item.innerHTML = "";
      item.style.opacity = 0;
    });

    let i = 0;
    function animateNextInsight() {
      if (i < insightItems.length) {
        const item = insightItems[i];
        const key = item.getAttribute("data-translate");
        const text = translations[key][lang];
        console.log(`Typing insight: Key=${key}, Lang=${lang}, Text="${text}"`);

        typeInsight(item, text, () => {
          insightAnimationTimeout = setTimeout(() => {
            i++;
            animateNextInsight();
          }, 500); // Pause between bullet points
        });
      } else {
        insightAnimationRunning = false;
        insightAnimationCompleted = true; // Mark as completed
      }
    }
    animateNextInsight();
  };

  // Function to stop and reset the insight animation
  const resetKeyInsightsAnimation = () => {
    if (!isHoveringInsights) { // Only reset if not hovering
      insightAnimationRunning = false;
      insightAnimationCompleted = false;
      clearTimeout(insightAnimationTimeout);
      showStaticInsights(); // Show static content instead of empty
    }
  };

  const createCharts = () => {
    const performanceChartCtx = document
      .getElementById("performanceChart")
      .getContext("2d");
    const portfolioEvolutionCtx = document
      .getElementById("portfolioEvolutionChart")
      .getContext("2d");

    const textColor = "#6b7280";
    const gridColor = "rgba(107, 114, 128, 0.2)";
    const bubbleColor = "#afbff4";
    const traditionalColor = "#6b7280";

    const performanceData = {
      labels: ["10 years", "20 years", "30 years"],
      datasets: [
        {
          label: "Bubble",
          data: [391000, 771000, 1521000],
          backgroundColor: bubbleColor,
          borderRadius: 8,
        },
        {
          label: "Traditional",
          data: [338000, 615000, 1213000],
          backgroundColor: traditionalColor,
          borderRadius: 8,
        },
      ],
    };

    const evolutionData = {
      labels: Array.from({ length: 31 }, (_, i) => i),
      datasets: [
        {
          label: "Bubble",
          data: Array.from(
            { length: 31 },
            (_, i) => 200000 * Math.pow(1.07, i) - 120 * i,
          ),
          borderColor: bubbleColor,
          backgroundColor: "rgba(175, 191, 244, 0.1)",
          fill: true,
          tension: 0.4,
          pointRadius: 0,
        },
        {
          label: "Traditional",
          data: (() => {
            let values = [200000];
            for (let i = 1; i <= 30; i++) {
              values.push(values[i - 1] * (1.07 - 0.02));
            }
            return values;
          })(),
          borderColor: traditionalColor,
          backgroundColor: "rgba(107, 114, 128, 0.1)",
          fill: true,
          tension: 0.4,
          pointRadius: 0,
        },
      ],
    };

    const baseOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: "rgba(0, 0, 0, 0.8)",
          titleColor: "#ffffff",
          bodyColor: "#ffffff",
          padding: 12,
          cornerRadius: 8,
          callbacks: {
            label: (context) =>
              `${context.dataset.label}: ${new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", minimumFractionDigits: 0 }).format(context.parsed.y)}`,
          },
        },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: textColor, font: { family: "Inter, sans-serif" } },
        },
        y: {
          grid: { color: gridColor, borderDash: [3, 3], drawBorder: false },
          ticks: {
            color: textColor,
            font: { family: "Inter, sans-serif" },
            callback: (value) =>
              `${new Intl.NumberFormat("fr-FR").format(value / 1000)}k€`,
          },
        },
      },
    };

    charts.push(
      new Chart(performanceChartCtx, {
        type: "bar",
        data: performanceData,
        options: baseOptions,
      }),
    );
    charts.push(
      new Chart(portfolioEvolutionCtx, {
        type: "line",
        data: evolutionData,
        options: baseOptions,
      }),
    );
  };

  // --- Main Initialization Function ---
  const init = () => {
    if (chartsInitialized) return;
    chartsInitialized = true;
    createDots();
    createCharts();
    updateSlider();
    startInterval();

    // Event listeners for prev/next buttons (if they are ever re-enabled)
    const prevButton = document.querySelector(".slider-arrow.prev");
    const nextButton = document.querySelector(".slider-arrow.next");
    if (prevButton)
      prevButton.addEventListener("click", () => {
        currentIndex = currentIndex > 0 ? currentIndex - 1 : slides.length - 1;
        updateSlider();
        resetInterval();
      });
    if (nextButton)
      nextButton.addEventListener("click", () => {
        currentIndex = currentIndex < slides.length - 1 ? currentIndex + 1 : 0;
        updateSlider();
        resetInterval();
      });

    sliderWrapper.addEventListener("mouseenter", () =>
      clearInterval(slideInterval),
    );
    sliderWrapper.addEventListener("mouseleave", () => startInterval());

    let touchStartX = 0;
    slider.addEventListener(
      "touchstart",
      (e) => (touchStartX = e.changedTouches[0].screenX),
      { passive: true },
    );
    slider.addEventListener(
      "touchend",
      (e) => {
        const touchEndX = e.changedTouches[0].screenX;
        if (touchEndX < touchStartX - 50)
          currentIndex =
            currentIndex < slides.length - 1 ? currentIndex + 1 : 0;
        else if (touchEndX > touchStartX + 50)
          currentIndex =
            currentIndex > 0 ? currentIndex - 1 : slides.length - 1;
        updateSlider();
        resetInterval();
      },
      { passive: true },
    );
  };

  const chartObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          init();
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1 },
  );

  if (sliderWrapper) {
    chartObserver.observe(sliderWrapper);
  }

  const insightObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          initKeyInsightsAnimation();
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1 },
  );

  if (insightTile) {
    // Show static content initially
    showStaticInsights();
    
    insightObserver.observe(insightTile);

    // Add hover event listeners with improved logic
    insightTile.addEventListener("mouseenter", () => {
      isHoveringInsights = true;
      if (!insightAnimationCompleted) {
        initKeyInsightsAnimation();
      }
    });

    insightTile.addEventListener("mouseleave", () => {
      isHoveringInsights = false;
      resetKeyInsightsAnimation();
    });
  }

  // Listen for custom languageChanged event
  document.addEventListener("languageChanged", () => {
    insightAnimationCompleted = false; // Reset completion state on language change
    resetKeyInsightsAnimation();
    showStaticInsights(); // Always show static content after language change
    if (isHoveringInsights) {
      initKeyInsightsAnimation();
    }
  });
});