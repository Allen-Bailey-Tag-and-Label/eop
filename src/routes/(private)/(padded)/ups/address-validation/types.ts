export type AddressClassification = {
    Code: "0",
    Description: "UnClassified"
} | {
    Code: "1",
    Description: "Commercial"
} | {
    Code: "2",
    Description: "Residential"
}
export type AddressKeyFormat = {
    AddressLine: string[],
    PoliticalDivision2: string,
    PoliticalDivision1: string,
    PostcodePrimaryLow: string,
    PostcodeExtendedLow: string,
    Region: string,
    CountryCode: string
}
export type Candidate = {
    AddressClassification: AddressClassification,
    AddressKeyFormat: AddressKeyFormat
}