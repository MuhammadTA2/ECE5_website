# Adding project images and videos

The portfolio creates the project index, preview cards, and detail pages from `src/projects.ts`. You do not need to edit the page layout.

## 1. Prepare the files

- Convert HEIC photos to JPG, WebP, or PNG before uploading.
- Use H.264 video with AAC audio in an `.mp4` container.
- Keep each video below 25 MiB if you upload through github.com.
- Export one JPG poster frame for every video so the gallery has a preview before playback.
- Use lowercase descriptive filenames without spaces.

## 2. Upload the media

On GitHub, open `public/projects/`, create or open the folder matching the project slug, choose **Add file → Upload files**, and commit the uploads to `main`.

Example:

```text
public/projects/occupancy-grid-compression/
├── hardware-overview.jpg
├── demo-poster.jpg
└── demo.mp4
```

## 3. Add the media records

Open `src/projects.ts`, find the project, and add entries to its `gallery` array.

Image:

```ts
{
  type: 'image',
  src: 'projects/occupancy-grid-compression/hardware-overview.jpg',
  alt: 'Describe what is visibly shown in the image',
  caption: 'A short optional caption.',
  wide: true,
}
```

Video:

```ts
{
  type: 'video',
  src: 'projects/occupancy-grid-compression/demo.mp4',
  poster: 'projects/occupancy-grid-compression/demo-poster.jpg',
  title: 'Accessible name for the video',
  caption: 'A short optional caption.',
  wide: true,
}
```

Use `portrait: true` for a vertical video. Remove `wide: true` when two items should sit beside each other on larger screens.

## 4. Choose the project preview

Set the project's `previewImage` to the image that should appear on the homepage and Projects index:

```ts
previewImage: 'projects/occupancy-grid-compression/hardware-overview.jpg',
```

## 5. Publish

Commit the `src/projects.ts` change to `main`. The GitHub Pages workflow validates and publishes the updated portfolio automatically.

Videos use manual controls and metadata-only preloading, so opening the project page does not download every full video immediately.
