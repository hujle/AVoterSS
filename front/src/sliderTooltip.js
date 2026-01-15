const sliderSuggestions = {
	ColorSlider: ['Pale', 'Light', 'Medium', 'Dark', 'Black Hole'],
	HairSlider: ['Smooth', 'Slightly Hairy', 'Hairy', 'Very Hairy', 'Jungle Forest'],
	TightSlider: ['Very Loose', 'Loose', 'Moderate', 'Tight', 'Very Tight'],
};

function initSliderTooltips() {
	Object.keys(sliderSuggestions).forEach(sliderId => {
		const slider = document.getElementById(sliderId);
		if (!slider) return;

		const suggestions = sliderSuggestions[sliderId];
		const container = slider.parentElement;
		
		// Create tooltip element
		const tooltip = document.createElement('div');
		tooltip.className = 'SliderTooltip';
		tooltip.textContent = suggestions[2]; // Start with middle suggestion
		container.insertBefore(tooltip, slider);

		// Function to get thumb radius based on screen size
		function getThumbRadius() {
			const isMobile = window.matchMedia('(max-width: 1100px)').matches;
			// Desktop: 18px thumb, radius = 9px; Mobile: 36px thumb, radius = 18px
			// Using slightly larger values for proper track coverage
			return isMobile ? 20 : 11;
		}

		// Get initial thumb radius
		let thumbRadius = getThumbRadius();

		// Function to update tooltip position
		function updateTooltipPosition() {
			// Recalculate thumb radius in case screen size changed
			thumbRadius = getThumbRadius();
			
			const value = parseInt(slider.value);
			const max = parseInt(slider.max);
			const min = parseInt(slider.min);
			const percent = ((value - min) / (max - min)) * 100;
			
			// Get dimensions
			const sliderRect = slider.getBoundingClientRect();
			const containerRect = container.getBoundingClientRect();
			
			// Calculate thumb position accounting for thumb radius
			// The track doesn't extend all the way to the edges
			const trackStart = thumbRadius;
			const trackEnd = sliderRect.width - thumbRadius;
			const trackLength = trackEnd - trackStart;
			
			// Position along the track
			const thumbPosInTrack = trackStart + (trackLength * percent / 100);
			
			// Position relative to container
			const containerRelativeLeft = sliderRect.left - containerRect.left;
			const absoluteThumbPosition = containerRelativeLeft + thumbPosInTrack;
			
			// Position tooltip at the thumb center
			const tooltipPercent = (absoluteThumbPosition / containerRect.width) * 100;
			tooltip.style.left = tooltipPercent + '%';
		}

		// Update tooltip on input
		slider.addEventListener('input', () => {
			const value = parseInt(slider.value);
			const index = Math.floor((value / 100) * 5);
			const clampedIndex = Math.min(index, 4);
			tooltip.textContent = suggestions[clampedIndex];
			updateTooltipPosition();
			tooltip.style.opacity = '1';
			tooltip.style.visibility = 'visible';
		});

		// Hide tooltip on mouse leave
		container.addEventListener('mouseleave', () => {
			tooltip.style.opacity = '0';
			tooltip.style.visibility = 'hidden';
		});

		// Show tooltip on mouse enter
		container.addEventListener('mouseenter', () => {
			updateTooltipPosition();
			tooltip.style.opacity = '1';
			tooltip.style.visibility = 'visible';
		});

		// Update on window resize
		window.addEventListener('resize', () => {
			updateTooltipPosition();
		});

		// Initialize position
		setTimeout(updateTooltipPosition, 0);
	});
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
	document.addEventListener('DOMContentLoaded', initSliderTooltips);
} else {
	initSliderTooltips();
}