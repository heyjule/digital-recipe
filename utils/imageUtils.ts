export const getGoogleDriveImageUrl = (url: string) => {
  if (!url) return '';
  
  // Jika sudah merupakan link direct/eksternal lain, biarkan
  if (!url.includes('drive.google.com')) return url;

  // Mengubah link 'view' menjadi link 'uc' (direct download)
  const fileId = url.split('/d/')[1]?.split('/')[0] || url.split('id=')[1];
  return `https://lh3.googleusercontent.com/u/0/d/${fileId}`;
};