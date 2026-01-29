# Fix CORS Issue for Profile Picture Upload

The error you are seeing is because your Firebase Storage bucket is blocking requests from `localhost`. To fix this, you need to apply a CORS (Cross-Origin Resource Sharing) configuration to your bucket.

I have already created the necessary configuration file: `cors.json`.

## Steps to Apply the Fix

You need to use the `gsutil` command-line tool, which is part of the Google Cloud SDK.

### 1. Install Google Cloud SDK (if not installed)
If you don't have `gcloud` or `gsutil` installed, download and install it from:
[https://cloud.google.com/sdk/docs/install](https://cloud.google.com/sdk/docs/install)

### 2. Login
Open your terminal and login to your Google Cloud account:
```bash
gcloud auth login
```

### 3. Apply the CORS configuration
Run the following command in your project root (`c:\AntigravityDEV\Gym`):

```bash
gsutil cors set cors.json gs://gym-pro-control.firebasestorage.app
```

> **Note:** If the above bucket URL doesn't work, try the default App Engine bucket name:
> `gsutil cors set cors.json gs://gym-pro-control.appspot.com`

### 4. Verify
After running the command, wait a minute and try uploading the picture again. It should work!
