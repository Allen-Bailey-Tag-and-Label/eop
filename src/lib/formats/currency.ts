export const currency = (value:number) => {
    const { format } = new Intl.NumberFormat('en-US', {
        currency:'USD',
        style:'currency',
    });
    return format( value );
}