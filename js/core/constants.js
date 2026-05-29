// =========================================
// MATERIALS + PRICES
// =========================================

const MATERIALS = {

    textil: {

        width: 22,

        label: 'DTF TEXTIL (22")',

        tiers: [

            {
                length: 18,
                price: 300
            },

            {
                length: 36,
                price: 500
            }

        ]

    },

    uv: {

        label: 'DTF UV',

        widths: {

            '11.5': {

                label: 'DTF UV (11.5")',

                tiers: [

                    {
                        length: 11,
                        price: 300
                    },

                    {
                        length: 18,
                        price: 500
                    },

                    {
                        length: 24,
                        price: 700
                    },

                    {
                        length: 36,
                        price: 900
                    }

                ]

            },

            '16': {

                label: 'DTF UV (16")',

                tiers: [

                    {
                        length: 11,
                        price: 425
                    },

                    {
                        length: 18,
                        price: 700
                    },

                    {
                        length: 24,
                        price: 900
                    },

                    {
                        length: 36,
                        price: 1300
                    }

                ]

            }

        }

    }

};

const PX_PER_INCH = 24;
