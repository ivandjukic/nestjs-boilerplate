export const timeStringToMilliseconds = (timeString: string): number => {
    const unit = timeString.slice(-1) // Get the last character for the unit
    let value = parseInt(timeString.slice(0, -1))
    if (isNaN(value)) {
        value = 0
    }

    switch (unit) {
        case 'm': // Minutes
            return value * 60 * 1000
        case 'h': // Hours
            return value * 3600 * 1000
        case 'd': // Days
            return value * 86400 * 1000
        default:
            return 0
    }
}
