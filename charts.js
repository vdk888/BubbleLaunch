document.addEventListener('DOMContentLoaded', () => {
    const slider = document.querySelector('.charts-slider');
    const slides = document.querySelectorAll('.chart-slide');
    const prevButton = document.getElementById('prev-slide');
    const nextButton = document.getElementById('next-slide');
    const dotsContainer = document.querySelector('.slider-dots');

    if (!slider) return;

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
        slides.forEach((_, i) => {
            const dot = document.createElement('button');
            dot.classList.add('slider-dot');
            dot.addEventListener('click', () => showSlide(i));
            dotsContainer.appendChild(dot);
        });
    };

    const numberCounter = (animation) => {
        const chart = animation.chart;
        const ctx = chart.ctx;
        ctx.font = '600 12px Inter, sans-serif';
        ctx.fillStyle = '#333';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';

        chart.data.datasets.forEach((dataset, i) => {
            const meta = chart.getDatasetMeta(i);
            meta.data.forEach((bar, index) => {
                const value = chart.scales.y.getValueForPixel(bar.y);
                if (bar.height < 15) return; // Do not show value for small bars
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

        const performanceData = {
            labels: ['10 ans', '20 ans', '30 ans'],
            datasets: [{
                label: 'Bubble',
                data: [257462, 665877, 1725201],
                backgroundColor: '#007AFF',
                borderRadius: 6
            }, {
                label: 'Concurrent',
                data: [215893, 466096, 1006266],
                backgroundColor: '#87CEEB',
                borderRadius: 6
            }]
        };

        const costData = {
            labels: Array.from({ length: 31 }, (_, i) => i),
            datasets: [{
                label: 'Bubble (Fixe)',
                data: Array.from({ length: 31 }, (_, i) => 10 * 12 * i),
                borderColor: '#007AFF',
                tension: 0.4,
                pointRadius: 0
            }, {
                label: 'Concurrent (2% AUM)',
                data: Array.from({ length: 31 }, (_, i) => {
                    let portfolioValue = 10000 * Math.pow(1.07, i);
                    return portfolioValue * 0.02 * i;
                }),
                borderColor: '#87CEEB',
                tension: 0.4,
                pointRadius: 0
            }]
        };

        const performanceChart = new Chart(performanceChartCtx, {
            type: 'bar',
            data: performanceData,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: { y: { ticks: { callback: value => '€' + (value / 1000) + 'k' } } },
                animation: {
                    duration: 2000,
                    easing: 'easeOutQuart',
                    onProgress: numberCounter
                }
            }
        });

        const costChart = new Chart(costChartCtx, {
            type: 'line',
            data: costData,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: { y: { ticks: { callback: value => '€' + (value / 1000) + 'k' } } },
                animation: {
                    x: {
                        type: 'number',
                        easing: 'linear',
                        duration: 2000,
                        from: NaN, // Animate from 'nothing'
                        delay(ctx) {
                            if (ctx.type !== 'data' || ctx.xStarted) return 0;
                            ctx.xStarted = true;
                            return ctx.index * 50;
                        }
                    },
                    y: {
                        type: 'number',
                        easing: 'linear',
                        duration: 2000,
                        from: (ctx) => ctx.chart.scales.y.getPixelForValue(0),
                        delay(ctx) {
                            if (ctx.type !== 'data' || ctx.yStarted) return 0;
                            ctx.yStarted = true;
                            return ctx.index * 50;
                        }
                    }
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
    }, { threshold: 0.5 });

    const chartContainer = document.querySelector('.charts-section-container');
    if (chartContainer) {
        chartObserver.observe(chartContainer);
    }
});
