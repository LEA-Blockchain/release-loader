## LEA Release Loader (`lea-rl`)

This command-line tool securely downloads and extracts LEA release artifacts, verifying their integrity using PGP signatures. It automatically derives the signature file URL by appending `.asc` to the provided release file URL.

**Usage:**

```bash
npx lea-rl <releaseFileUrl> <destinationDir>
```

**Arguments:**

* `<releaseFileUrl>`: Full URL of the release artifact (e.g., `.tar.gz`).
* `<destinationDir>`: Local directory where files will be extracted.

**Verification:**

The tool verifies downloads using the embedded LEA Chain Release Signing Key:
* **Fingerprint:** `AD70 075B C14E A6B9 5B7B A526 18D9 8020 1D13 2886`
* **UID:** `Lea Chain (Release Signing Key) <releases@getlea.org>`

**Note:** This tool is primarily intended for internal build processes and automation within the LEA project. It is not designed for general public use outside of this scope.

## About

This project is part of the [LEA Project](https://getlea.org).

## Author

Developed by Allwin Ketnawang.

## License

This project is licensed under the [MIT License](LICENSE).
