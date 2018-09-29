const gulp = require("gulp")
const parcel = require("gulp-parcel")
const rename = require("gulp-rename")
const eslint = require("gulp-eslint")
const del = require("del")
const os = require("os")
const fs = require("fs")
const { spawn } = require("child_process")

const paths = {
  scripts:  ["conf.priv.js", "completions.js", "conf.js"],
  entry:    "conf.js",
  gulpfile: ["gulpfile.js"],
}

gulp.task("gulp-autoreload", () => {
  let p
  const spawnChildren = function spawnChildren() {
    if (p) p.kill()
    p = spawn("gulp", ["lint-gulpfile", "install", "watch-nogulpfile"], { stdio: "inherit" })
  }
  gulp.watch("gulpfile.js", spawnChildren)
  spawnChildren()
})

gulp.task("clean", () => del(["build", ".cache", ".tmp-gulp-compile-*"]))

gulp.task("lint", () =>
  gulp
    .src([].concat(paths.scripts, paths.gulpfile))
    .pipe(eslint())
    .pipe(eslint.format()))

gulp.task("lint", () =>
  gulp
    .src(paths.gulpfile)
    .pipe(eslint())
    .pipe(eslint.format()))

gulp.task("check-priv", () => {
  try {
    fs.statSync("./conf.priv.js")
  } catch (e) {
    // eslint-disable-next-line no-console
    console.log("Creating ./conf.priv.js based on ./conf.priv.example.js")
    fs.copyFileSync("./conf.priv.example.js", "./conf.priv.js", fs.constants.COPYFILE_EXCL)
  }
})

gulp.task("build", ["check-priv", "clean", "lint"], () => gulp.src(paths.entry, { read: false })
  .pipe(parcel())
  .pipe(rename("surfingkeys.conf"))
  .pipe(gulp.dest("build")))

gulp.task("install", ["build"], () => gulp.src("build/surfingkeys.conf")
  .pipe(gulp.dest(os.homedir())))

gulp.task("watch", () => {
  gulp.watch([].concat(paths.scripts, paths.gulpfile), ["install"])
})

gulp.task("watch-nogulpfile", () => {
  gulp.watch([].concat(paths.scripts), ["install"])
})

gulp.task("default", ["build"])
