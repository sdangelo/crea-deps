/*
 * Copyright (C) 2016 Stefano D'Angelo <zanga.mail@gmail.com>
 *
 * Permission to use, copy, modify, and/or distribute this software for any
 * purpose with or without fee is hereby granted, provided that the above
 * copyright notice and this permission notice appear in all copies.
 *
 * THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
 * WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
 * MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
 * ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
 * WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
 * ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
 * OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
 */

module.exports = function (Crea) {
	Crea.createFileTaskWithDeps =
	function (targets, prereqs, run, depFile, getDeps)
	{
		return this.createTask(this.fileTaskWithDeps, targets, prereqs,
				       run, depFile, getDeps);
	};

	Crea.fileTaskWithDeps = Object.create(Crea.fileTask);
	Crea.fileTaskWithDeps.realRun = null;
	Crea.fileTaskWithDeps.depFile = null;
	Crea.fileTaskWithDeps.deps = null;
	Crea.fileTaskWithDeps.getDeps = null;

	Crea.fileTaskWithDeps.init =
	function (targets, prereqs, run, depFile, getDeps) {
		this.targets = targets;
		this.prereqs = prereqs;
		this.realRun = run;
		this.depFile = depFile;
		this.getDeps = getDeps;
	};

	Crea.fileTaskWithDeps.getTargetFiles = function () {
		return this.targets.concat(this.depFile);
	};

	Crea.fileTaskWithDeps.evalRunSchedule =
	function (Crea, schedule, fromTask) {
		var prereqTasks = Crea.findTasks(this.prereqs);
		for (var i = 0; i < prereqTasks.length; i++)
			prereqTasks[i].getRunSchedule(Crea, schedule, this);

		var toRun = this.decideToRun(Crea, schedule, fromTask,
					     this.prereqs, prereqTasks);

		this.deps = toRun ? this.getDeps()
				  : JSON.parse(
					Crea.fs.readFileSync(this.depFile,
							     "utf8"));
		var depTasks = Crea.findTasks(this.deps);
		for (var i = 0; i < depTasks.length; i++)
			depTasks[i].getRunSchedule(Crea, schedule, this);

		toRun = toRun || this.decideToRun(Crea, schedule, fromTask,
						  this.deps, depTasks);
		if (toRun) {
			for (var i = 0; i < prereqTasks.length; i++)
				prereqTasks[i].propagateToRun(Crea, schedule,
							      prereqTasks);
			for (var i = 0; i < depTasks.length; i++)
				depTasks[i].propagateToRun(Crea, schedule,
							   prereqTasks);
		}
		return toRun;
	};

	Crea.fileTaskWithDeps.run = function () {
		if (this.realRun)
			this.realRun();

		Crea.fs.outputFileSync(this.depFile, JSON.stringify(this.deps),
				       "utf8");
	};
}
