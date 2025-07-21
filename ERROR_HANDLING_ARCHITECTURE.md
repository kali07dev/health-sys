## Error Handling System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Error Handling Flow                        │
└─────────────────────────────────────────────────────────────────┘

   User Action
       │
       ▼
┌─────────────┐
│  API Call   │ ──┐
│  Form       │   │
│  Validation │   │
└─────────────┘   │
       │          │
       ▼          │
┌─────────────┐   │    ┌─────────────────────────────────────┐
│   Error     │ ──┼───▶│           Error Context             │
│  Occurs     │   │    │  ┌─────────────────────────────────┐ │
└─────────────┘   │    │  │     getErrorContext()          │ │
                  │    │  │                                 │ │
                  │    │  │ 1. Check ERROR_MESSAGES map    │ │
                  │    │  │ 2. Pattern match message       │ │
                  │    │  │ 3. Fallback to default         │ │
                  │    │  └─────────────────────────────────┘ │
                  │    └─────────────────────────────────────┘
                  │              │
                  │              ▼
                  │    ┌─────────────────────────────────────┐
                  │    │        Error Categories             │
                  │    │                                     │
                  │    │ 🔸 USER_INPUT                       │
                  │    │   - Validation errors               │
                  │    │   - Missing fields                  │
                  │    │   - Invalid formats                 │
                  │    │                                     │
                  │    │ 🔒 AUTH_ERROR                       │
                  │    │   - Session expired                 │
                  │    │   - Insufficient permissions        │
                  │    │   - Login required                  │
                  │    │                                     │
                  │    │ 🌐 USER_ACTIONABLE                  │
                  │    │   - Network issues                  │
                  │    │   - Timeout errors                  │
                  │    │   - Rate limiting                   │
                  │    │                                     │
                  │    │ ⚠️ SYSTEM_ERROR                     │
                  │    │   - Server errors                   │
                  │    │   - Database issues                 │
                  │    │   - Unexpected failures             │
                  │    └─────────────────────────────────────┘
                  │              │
                  │              ▼
                  │    ┌─────────────────────────────────────┐
                  │    │         showErrorToast()            │
                  │    │                                     │
                  │    │ • Formats message with title       │
                  │    │ • Adds actionable suggestions      │
                  │    │ • Sets appropriate duration        │
                  │    │ • Applies error-type styling       │
                  │    │ • Shows retry button if retryable  │
                  │    └─────────────────────────────────────┘
                  │              │
                  └──────────────┼─────────────────────────────┐
                                 ▼                             │
                  ┌─────────────────────────────────────┐      │
                  │           User Sees                 │      │
                  │                                     │      │
                  │ 🚨 Clear Title                      │      │
                  │ "Please check your input"           │      │
                  │                                     │      │
                  │ 📝 Detailed Message                 │      │
                  │ "Some information is missing..."    │      │
                  │                                     │      │
                  │ 💡 Actionable Suggestion            │      │
                  │ "Check required fields and..."      │      │
                  │                                     │      │
                  │ [🔄 Try Again] (if retryable)       │      │
                  └─────────────────────────────────────┘      │
                                 │                             │
                                 ▼                             │
                  ┌─────────────────────────────────────┐      │
                  │         User Action                 │      │
                  │                                     │      │
                  │ • Fixes input validation           │      │
                  │ • Signs in again                   │      │
                  │ • Checks internet connection       │      │
                  │ • Contacts support                  │      │
                  │ • Clicks retry button              │ ─────┘
                  └─────────────────────────────────────┘

Configuration Files:
┌─────────────────────────────────────────────────────────────────┐
│ error-config.ts         │ error-handling.ts                     │
│ ─────────────────      │ ───────────────────                   │
│ • ERROR_MESSAGES       │ • getErrorContext()                   │
│ • DEFAULT_ERROR        │ • showErrorToast()                    │
│ • ERROR_PATTERNS       │ • showSuccessToast()                  │
│                        │ • isRetryableError()                  │
└─────────────────────────────────────────────────────────────────┘

Supporting Components:
┌─────────────────────────────────────────────────────────────────┐
│ form-validation.ts      │ error-display.tsx                     │
│ ────────────────────   │ ───────────────────                   │
│ • validateRequiredFields│ • ErrorDisplay                        │
│ • validatePasswordMatch │ • FormError                           │
│ • validateFileUpload   │ • InlineError                         │
│ • validateEmail        │                                       │
│ • validateDateRange    │                                       │
└─────────────────────────────────────────────────────────────────┘
```

## Key Benefits

1. **Consistency**: All errors follow the same helpful pattern
2. **User Empowerment**: Users understand what they can do
3. **Reduced Support**: Self-service error resolution
4. **Maintainability**: Centralized error message configuration
5. **Extensibility**: Easy to add new error types and patterns
6. **Accessibility**: Clear, jargon-free language for all users