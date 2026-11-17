<template>
  <svg viewBox="0 0 180 160" fill="none" xmlns="http://www.w3.org/2000/svg" focusable="false">
    <path
      d="M91 15 39 80m52-65 45 55"
      stroke="currentColor"
      stroke-width="4"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
    <circle cx="91" cy="15" r="6" fill="currentColor" />
    <g transform="rotate(-6 91 103)">
      <defs>
        <mask
          id="closed-cafe-sign-cutouts"
          maskUnits="userSpaceOnUse"
          x="0"
          y="0"
          width="180"
          height="160"
        >
          <path fill="white" d="M0 0h180v160H0z" />
          <circle cx="91" cy="101" r="20" fill="black" />
          <circle cx="100" cy="90" r="20" fill="white" />
          <circle cx="42" cy="74" r="3" fill="black" />
          <circle cx="140" cy="74" r="3" fill="black" />
        </mask>
      </defs>
      <rect
        x="30"
        y="63"
        width="122"
        height="80"
        rx="10"
        fill="currentColor"
        mask="url(#closed-cafe-sign-cutouts)"
      />
    </g>
  </svg>
</template>
