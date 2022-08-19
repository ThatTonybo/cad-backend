module.exports = {
    'env': {
        'browser': true,
        'commonjs': true,
        'es2021': true
    },
    'extends': [
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended'
    ],
    'overrides': [
    ],
    'parser': '@typescript-eslint/parser',
    'parserOptions': {
        'ecmaVersion': 'latest'
    },
    'plugins': [
        '@typescript-eslint'
    ],
    'rules': {
        'semi': ['error', 'always'],
        'quotes': ['error', 'single'],
        'curly': ['error', 'multi'],
        '@typescript-eslint/no-non-null-assertion': 'off'
    }
};