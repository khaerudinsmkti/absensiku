<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" @class(['dark' => ($appearance ?? 'system') == 'dark'])>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">

        {{-- Inline script to detect system dark mode preference and apply it immediately --}}
        <script>
            (function() {
                const appearance = '{{ $appearance ?? "system" }}';

                if (appearance === 'system') {
                    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

                    if (prefersDark) {
                        document.documentElement.classList.add('dark');
                    }
                }
            })();
        </script>

        {{-- Inline style to set the HTML background color based on our theme in app.css --}}
        <style>
            html {
                background-color: oklch(1 0 0);
            }

            html.dark {
                background-color: oklch(0.145 0 0);
            }
        </style>

        @php
            $schoolSetting = \App\Models\SchoolSetting::getSetting();
            $schoolLogoUrl = $schoolSetting->logo_url;
            $appName = $schoolSetting->name ?: config('app.name', 'AbsensiKu');
        @endphp

        {{-- Dynamic Favicon & Icons from School Settings --}}
        @if($schoolLogoUrl)
            <link rel="icon" href="{{ $schoolLogoUrl }}" type="image/png">
            <link rel="shortcut icon" href="{{ $schoolLogoUrl }}">
            <link rel="apple-touch-icon" href="{{ $schoolLogoUrl }}">
        @else
            <link rel="icon" href="/favicon.ico" sizes="any">
            <link rel="icon" href="/favicon.svg" type="image/svg+xml">
            <link rel="apple-touch-icon" href="/apple-touch-icon.png">
        @endif

        {{-- PWA Manifest & Meta Tags --}}
        <link rel="manifest" href="/manifest.json">
        <meta name="theme-color" content="#FF6B35">
        <meta name="mobile-web-app-capable" content="yes">
        <meta name="apple-mobile-web-app-capable" content="yes">
        <meta name="apple-mobile-web-app-status-bar-style" content="default">
        <meta name="apple-mobile-web-app-title" content="{{ $appName }}">
        <meta name="application-name" content="{{ $appName }}">

        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" />

        @fonts

        @viteReactRefresh
        @vite(['resources/css/app.css', 'resources/js/app.tsx', "resources/js/pages/{$page['component']}.tsx"])
        <x-inertia::head>
            <title>{{ $appName }}</title>
        </x-inertia::head>
    </head>
    <body class="font-sans antialiased">
        <x-inertia::app />

        {{-- Register Service Worker for PWA --}}
        <script>
            if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                    navigator.serviceWorker.register('/sw.js').then(
                        function(reg) {
                            console.log('[PWA] Service Worker terdaftar dengan scope:', reg.scope);
                        },
                        function(err) {
                            console.warn('[PWA] Pendaftaran Service Worker gagal:', err);
                        }
                    );
                });
            }
        </script>
    </body>
</html>
