/**
 * Screenshot utilities for file management
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { Logger } from 'winston';

export class ScreenshotUtils {
  constructor(
    private screenshotDir: string = path.join(process.cwd(), 'screenshots'),
    private logger?: Logger
  ) {}

  /**
   * Clean up old screenshots (older than specified days)
   */
  async cleanupOldScreenshots(daysOld: number = 7): Promise<number> {
    try {
      const files = await fs.readdir(this.screenshotDir);
      const cutoffTime = Date.now() - (daysOld * 24 * 60 * 60 * 1000);
      let deletedCount = 0;

      for (const file of files) {
        if (file.match(/^screenshot_.*\.(png|jpeg)$/)) {
          const filePath = path.join(this.screenshotDir, file);
          const stats = await fs.stat(filePath);
          
          if (stats.mtime.getTime() < cutoffTime) {
            await fs.unlink(filePath);
            deletedCount++;
            this.logger?.info(`Deleted old screenshot: ${file}`);
          }
        }
      }

      this.logger?.info(`Cleanup completed: ${deletedCount} files deleted`);
      return deletedCount;
    } catch (error) {
      this.logger?.error('Screenshot cleanup failed:', error);
      return 0;
    }
  }

  /**
   * Get list of recent screenshots
   */
  async getRecentScreenshots(limit: number = 10): Promise<string[]> {
    try {
      const files = await fs.readdir(this.screenshotDir);
      const screenshots = files
        .filter(file => file.match(/^screenshot_.*\.(png|jpeg)$/))
        .map(file => ({
          name: file,
          path: path.join(this.screenshotDir, file),
          mtime: 0
        }));

      // Get file stats for sorting
      for (const screenshot of screenshots) {
        try {
          const stats = await fs.stat(screenshot.path);
          screenshot.mtime = stats.mtime.getTime();
        } catch {
          // Skip files we can't access
        }
      }

      return screenshots
        .sort((a, b) => b.mtime - a.mtime)
        .slice(0, limit)
        .map(s => s.path);
    } catch (error) {
      this.logger?.error('Failed to get recent screenshots:', error);
      return [];
    }
  }

  /**
   * Get screenshot directory info
   */
  async getDirectoryInfo(): Promise<{
    path: string;
    totalFiles: number;
    totalSize: number;
    oldestFile?: string;
    newestFile?: string;
  }> {
    try {
      const files = await fs.readdir(this.screenshotDir);
      const screenshots = [];
      let totalSize = 0;

      for (const file of files) {
        if (file.match(/^screenshot_.*\.(png|jpeg)$/)) {
          const filePath = path.join(this.screenshotDir, file);
          try {
            const stats = await fs.stat(filePath);
            totalSize += stats.size;
            screenshots.push({
              name: file,
              mtime: stats.mtime.getTime()
            });
          } catch {
            // Skip files we can't access
          }
        }
      }

      const sorted = screenshots.sort((a, b) => a.mtime - b.mtime);
      
      return {
        path: this.screenshotDir,
        totalFiles: screenshots.length,
        totalSize,
        oldestFile: sorted[0]?.name,
        newestFile: sorted[sorted.length - 1]?.name
      };
    } catch (error) {
      this.logger?.error('Failed to get directory info:', error);
      return {
        path: this.screenshotDir,
        totalFiles: 0,
        totalSize: 0
      };
    }
  }
}
