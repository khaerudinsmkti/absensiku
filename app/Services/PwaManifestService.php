<?php

namespace App\Services;

use App\Models\SchoolSetting;

class PwaManifestService
{
    /**
     * Get dynamic PWA manifest data based on school settings
     */
    public static function getManifestData(): array
    {
        $school = SchoolSetting::getSetting();
        $name = $school->name ?: 'AbsensiKu';
        $shortName = $school->name ?: 'AbsensiKu';

        return [
            'id' => '/?source=pwa',
            'name' => $name,
            'short_name' => $shortName,
            'description' => 'Aplikasi Presensi Siswa dan Manajemen Sekolah - ' . $name,
            'start_url' => '/?source=pwa',
            'scope' => '/',
            'display' => 'standalone',
            'orientation' => 'portrait-primary',
            'background_color' => '#FFFFFF',
            'theme_color' => '#FF6B35',
            'categories' => ['education', 'productivity'],
            'icons' => [
                [
                    'src' => '/icons/icon-192x192.png',
                    'sizes' => '192x192',
                    'type' => 'image/png',
                    'purpose' => 'any',
                ],
                [
                    'src' => '/icons/icon-512x512.png',
                    'sizes' => '512x512',
                    'type' => 'image/png',
                    'purpose' => 'any',
                ],
                [
                    'src' => '/icons/icon-maskable-512x512.png',
                    'sizes' => '512x512',
                    'type' => 'image/png',
                    'purpose' => 'maskable',
                ],
            ],
        ];
    }

    /**
     * Regenerate PWA icons and update manifest.json file
     */
    public static function syncManifest(): void
    {
        $school = SchoolSetting::getSetting();

        $iconsDir = public_path('icons');
        if (! is_dir($iconsDir)) {
            mkdir($iconsDir, 0755, true);
        }

        $sourceLogoPath = null;
        if ($school->logo_path && file_exists(storage_path('app/public/' . $school->logo_path))) {
            $sourceLogoPath = storage_path('app/public/' . $school->logo_path);
        }

        // Generate icons if GD is available
        if (extension_loaded('gd')) {
            static::generateIcon($iconsDir . '/icon-192x192.png', 192, $sourceLogoPath, false);
            static::generateIcon($iconsDir . '/icon-512x512.png', 512, $sourceLogoPath, false);
            static::generateIcon($iconsDir . '/icon-maskable-512x512.png', 512, $sourceLogoPath, true);
        }

        $manifestData = static::getManifestData();

        file_put_contents(
            public_path('manifest.json'),
            json_encode($manifestData, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE)
        );
    }

    private static function generateIcon(string $targetPath, int $size, ?string $sourceImage = null, bool $isMaskable = false): void
    {
        $img = imagecreatetruecolor($size, $size);
        imagesavealpha($img, true);

        if ($isMaskable) {
            $bgColor = imagecolorallocate($img, 255, 255, 255);
            imagefilledrectangle($img, 0, 0, $size, $size, $bgColor);
        } else {
            $transparent = imagecolorallocatealpha($img, 0, 0, 0, 127);
            imagefill($img, 0, 0, $transparent);
        }

        if ($sourceImage && file_exists($sourceImage)) {
            $info = @getimagesize($sourceImage);
            $mime = $info['mime'] ?? '';
            $src = null;
            if ($mime === 'image/png') {
                $src = @imagecreatefrompng($sourceImage);
            } elseif ($mime === 'image/jpeg' || $mime === 'image/jpg') {
                $src = @imagecreatefromjpeg($sourceImage);
            } elseif ($mime === 'image/webp') {
                $src = @imagecreatefromwebp($sourceImage);
            }

            if ($src) {
                $origW = imagesx($src);
                $origH = imagesy($src);

                $paddingRatio = $isMaskable ? 0.20 : 0.08;
                $innerSize = (int) round($size * (1 - ($paddingRatio * 2)));

                $scale = min($innerSize / $origW, $innerSize / $origH);
                $newW = (int) round($origW * $scale);
                $newH = (int) round($origH * $scale);

                $dstX = (int) round(($size - $newW) / 2);
                $dstY = (int) round(($size - $newH) / 2);

                imagecopyresampled($img, $src, $dstX, $dstY, 0, 0, $newW, $newH, $origW, $origH);
                imagedestroy($src);
            }
        } else {
            $bg = imagecolorallocate($img, 255, 107, 53); // #FF6B35
            imagefilledrectangle($img, 0, 0, $size, $size, $bg);
        }

        imagepng($img, $targetPath, 9);
        imagedestroy($img);
    }
}

