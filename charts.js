document.addEventListener('DOMContentLoaded', () => {
    const slider = document.querySelector('.charts-slider');
    const slides = document.querySelectorAll('.chart-slide');
    const prevButton = document.querySelector('.slider-arrow.prev');
    const nextButton = document.querySelector('.slider-arrow.next');
    const dotsContainer = document.querySelector('.slider-dots');

    if (!slider || !slides.length || !prevButton || !nextButton || !dotsContainer) {
        console.error('Slider elements not found. Chart slider will not be initialized.');
        return;
    }

    let currentIndex = 0;
    let charts = [];
    let chartsInitialized = false;

    const showSlide = (index) => {
        slider.style.transform = `translateX(-${index * 100}%)`;
        updateDots(index);
        currentIndex = index;
    };

    const updateDots = (index) => {
        const dots = document.querySelectorAll('.slider-dot');
        dots.forEach((dot, i) => {
            dot.classList.toggle('active', i === index);
        });
    };

    const createDots = () => {
        dotsContainer.innerHTML = '';
        slides.forEach((_, i) => {
            const dot = document.createElement('button');
            dot.classList.add('slider-dot');
            dot.setAttribute('aria-label', `Go to slide ${i + 1}`);
            dot.addEventListener('click', () => showSlide(i));
            dotsContainer.appendChild(dot);
        });
    };

    const numberCounter = (animation) => {
        const chart = animation.chart;
        const ctx = chart.ctx;
        ctx.font = '600 12px Inter, sans-serif';
        ctx.fillStyle = '#2D3748'; // Use new text color
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';

        chart.data.datasets.forEach((dataset, i) => {
            const meta = chart.getDatasetMeta(i);
            meta.data.forEach((bar, index) => {
                const value = chart.scales.y.getValueForPixel(bar.y);
                if (bar.height < 15) return;
                const formattedValue = new Intl.NumberFormat('fr-FR', {
                    style: 'currency',
                    currency: 'EUR',
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0
                }).format(value);
                ctx.fillText(formattedValue, bar.x, bar.y - 5);
            });
        });
    };

    const createCharts = () => {
        const performanceChartCtx = document.getElementById('performanceChart').getContext('2d');
        const costChartCtx = document.getElementById('costChart').getContext('2d');

        // Create gradients for Performance Chart
        const bubbleGradient = performanceChartCtx.createLinearGradient(0, 0, 0, 300);
        bubbleGradient.addColorStop(0, '#4A5FFF');
        bubbleGradient.addColorStop(1, '#7B6EF5');

        const traditionalGradient = performanceChartCtx.createLinearGradient(0, 0, 0, 300);
        traditionalGradient.addColorStop(0, '#B0C4DE');
        traditionalGradient.addColorStop(1, '#E6F3FF');

        const performanceData = {
            labels: ['10 ans', '20 ans', '30 ans'],
            datasets: [{
                label: 'Bubble',
                data: [257462, 665877, 1725201],
                backgroundColor: bubbleGradient,
                borderRadius: 8
            }, {
                label: 'Concurrent',
                data: [215893, 466096, 1006266],
                backgroundColor: traditionalGradient,
                borderRadius: 8
            }]
        };

        // Create gradients for Cost Chart
        const bubbleLineGradient = costChartCtx.createLinearGradient(0, 0, 0, 300);
        bubbleLineGradient.addColorStop(0, '#4A5FFF');
        bubbleLineGradient.addColorStop(1, '#7B6EF5');

        const traditionalLineGradient = costChartCtx.createLinearGradient(0, 0, 0, 300);
        traditionalLineGradient.addColorStop(0, '#B0C4DE');
        traditionalLineGradient.addColorStop(1, '#E6F3FF');

        const bubbleFillGradient = costChartCtx.createLinearGradient(0, 0, 0, 300);
        bubbleFillGradient.addColorStop(0, 'rgba(74, 95, 255, 0.3)');
        bubbleFillGradient.addColorStop(1, 'rgba(123, 110, 245, 0.05)');

        const traditionalFillGradient = costChartCtx.createLinearGradient(0, 0, 0, 300);
        traditionalFillGradient.addColorStop(0, 'rgba(176, 196, 222, 0.3)');
        traditionalFillGradient.addColorStop(1, 'rgba(230, 243, 255, 0.05)');

        const costData = {
            labels: Array.from({ length: 31 }, (_, i) => i),
            datasets: [{
                label: 'Bubble (Fixe)',
                data: Array.from({ length: 31 }, (_, i) => 120 * i), // 10*12
                borderColor: bubbleLineGradient,
                backgroundColor: bubbleFillGradient,
                fill: true,
                tension: 0.4,
                pointRadius: 0
            }, {
                label: 'Concurrent (2% AUM)',
                data: Array.from({ length: 31 }, (_, i) => {
                    let fees = 0;
                    const initialInvestment = 100000;
                    for (let j = 1; j <= i; j++) {
                        fees += (initialInvestment * Math.pow(1.07, j)) * 0.02;
                    }
                    return fees;
                }),
                borderColor: traditionalLineGradient,
                backgroundColor: traditionalFillGradient,
                fill: true,
                tension: 0.4,
                pointRadius: 0
            }]
        };

        const chartOptions = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: 'rgba(255, 255, 255, 0.8)',
                    titleColor: '#2D3748',
                    bodyColor: '#2D3748',
                    borderColor: 'rgba(74, 95, 255, 0.1)',
                    borderWidth: 1,
                    padding: 10,
                    cornerRadius: 8,
                    displayColors: false,
                }
            },
            scales: {
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        color: '#2D3748'
                    }
                },
                y: {
                    grid: {
                        color: 'rgba(226, 232, 240, 0.8)',
                        borderDash: [3, 3],
                        drawBorder: false,
                    },
                    ticks: {
                        color: '#2D3748',
                        callback: value => '€' + (value / 1000) + 'k'
                    }
                }
            }
        };

        const performanceChart = new Chart(performanceChartCtx, {
            type: 'bar',
            data: performanceData,
            options: {
                ...chartOptions,
                animation: {
                    duration: 1500,
                    easing: 'easeOutQuart',
                    onProgress: numberCounter
                }
            }
        });

        const costChart = new Chart(costChartCtx, {
            type: 'line',
            data: costData,
            options: {
                ...chartOptions,
                animation: {
                    duration: 1500,
                    easing: 'easeOutQuart'
                }
            }
        });

        charts = [performanceChart, costChart];
    };

    const initSliderAndCharts = () => {
        if (chartsInitialized) return;
        chartsInitialized = true;

        createDots();
        createCharts();
        showSlide(0);

        prevButton.addEventListener('click', () => {
            currentIndex = (currentIndex > 0) ? currentIndex - 1 : slides.length - 1;
            showSlide(currentIndex);
        });

        nextButton.addEventListener('click', () => {
            currentIndex = (currentIndex < slides.length - 1) ? currentIndex + 1 : 0;
            showSlide(currentIndex);
        });
    };

    const chartObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                initSliderAndCharts();
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });

    const chartContainer = document.querySelector('.charts-section-container');
    if (chartContainer) {
        chartObserver.observe(chartContainer);
    }
});
