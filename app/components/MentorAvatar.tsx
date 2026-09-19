// The source portraits are full-body character art with lots of empty space around a small
// face, so object-cover alone leaves the face tiny — scale the image up inside a clipped
// circle to crop in on the face instead of just showing a bigger version of the whole figure.
export default function MentorAvatar({
  src,
  alt,
  className = "",
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  return (
    <div className={`rounded-full overflow-hidden shrink-0 bg-white ${className}`}>
      <img
        src={src}
        alt={alt}
        className="w-full h-full object-cover scale-[1.9] origin-[50%_35%]"
      />
    </div>
  );
}
