export const convert = (value: FormData) => {
	const formData = {
		to: {
			Object: () => {
				// initiate object
				const object: { [key: string]: any } = {};

				// loop over formData
				(value as FormData).forEach((formDataValue, key) => {
					object[key] = formDataValue.toString();
				});

				return object;
			}
		}
	};

	return {
		formData
	};
};
